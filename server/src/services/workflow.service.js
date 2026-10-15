import prisma from '../db/prisma.js';
import { createTask } from './task.service.js';
import { sendEmail } from './email.service.js';
import { renderTemplateContent } from './template.service.js';

export async function getWorkflows() {
  return prisma.workflow.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { runs: true }
      }
    }
  });
}

export async function getWorkflowById(id) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: {
      runs: {
        orderBy: { executedAt: 'desc' },
        take: 50
      }
    }
  });

  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }

  return workflow;
}

export async function createWorkflow(data) {
  return prisma.workflow.create({
    data: {
      name: data.name.trim(),
      description: data.description || null,
      triggerType: data.triggerType,
      triggerConfig: JSON.stringify(data.triggerConfig || {}),
      actionType: data.actionType,
      actionConfig: JSON.stringify(data.actionConfig || {}),
      enabled: Boolean(data.enabled)
    }
  });
}

export async function updateWorkflow(id, data) {
  const existing = await prisma.workflow.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.workflow.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.triggerType && { triggerType: data.triggerType }),
      ...(data.triggerConfig && { triggerConfig: JSON.stringify(data.triggerConfig) }),
      ...(data.actionType && { actionType: data.actionType }),
      ...(data.actionConfig && { actionConfig: JSON.stringify(data.actionConfig) }),
      ...(data.enabled !== undefined && { enabled: Boolean(data.enabled) })
    }
  });
}

export async function deleteWorkflow(id) {
  const existing = await prisma.workflow.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }
  await prisma.workflow.delete({ where: { id } });
  return { success: true };
}

export async function executeWorkflow(workflowId) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId }
  });

  if (!workflow) {
    const err = new Error('Workflow not found');
    err.statusCode = 404;
    throw err;
  }

  const triggerConfig = JSON.parse(workflow.triggerConfig || '{}');
  const actionConfig = JSON.parse(workflow.actionConfig || '{}');

  let processedCount = 0;
  let skippedCount = 0;
  let errorsCount = 0;

  // 1. INACTIVE_CUSTOMER Trigger
  if (workflow.triggerType === 'INACTIVE_CUSTOMER') {
    const daysInactive = triggerConfig.daysInactive || 60;
    const thresholdDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);

    const inactiveCustomers = await prisma.customer.findMany({
      where: {
        orderCount: { gt: 0 },
        lastOrderDate: { lte: thresholdDate }
      }
    });

    for (const customer of inactiveCustomers) {
      // Idempotency key: prevents executing for same customer within current monthly window
      const dateWindow = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
      const idempotencyKey = `wf_${workflow.id}_cust_${customer.id}_${dateWindow}`;

      const existingRun = await prisma.workflowRun.findUnique({
        where: { idempotencyKey }
      });

      if (existingRun) {
        skippedCount++;
        continue;
      }

      try {
        if (workflow.actionType === 'CREATE_TASK') {
          const taskTitle = actionConfig.taskTitle 
            ? renderTemplateContent(actionConfig.taskTitle, { name: `${customer.firstName} ${customer.lastName}`, email: customer.email })
            : `Reach out to inactive client: ${customer.firstName} ${customer.lastName}`;

          await createTask({
            title: taskTitle,
            description: `Automated retention task triggered by workflow "${workflow.name}". Customer has not placed an order in ${daysInactive}+ days.`,
            customerId: customer.id,
            priority: actionConfig.priority || 'HIGH',
            source: 'WORKFLOW'
          });

          await prisma.workflowRun.create({
            data: {
              workflowId: workflow.id,
              status: 'SUCCESS',
              idempotencyKey,
              targetId: customer.id,
              actionTaken: 'CREATE_TASK',
              details: JSON.stringify({ taskTitle, customerId: customer.id })
            }
          });
          processedCount++;
        } else if (workflow.actionType === 'DRAFT_EMAIL') {
          // Creates a communication record in DRAFT status for review
          await prisma.communication.create({
            data: {
              customerId: customer.id,
              recipientEmail: customer.email,
              recipientName: `${customer.firstName} ${customer.lastName}`,
              subject: actionConfig.subject || 'We miss you at our store!',
              body: actionConfig.body || `Hi ${customer.firstName},\n\nWe noticed you haven't shopped with us in a while. Here is a special follow-up!`,
              status: 'DRAFT',
              provider: 'RESEND'
            }
          });

          await prisma.workflowRun.create({
            data: {
              workflowId: workflow.id,
              status: 'SUCCESS',
              idempotencyKey,
              targetId: customer.id,
              actionTaken: 'DRAFT_EMAIL',
              details: JSON.stringify({ customerId: customer.id, email: customer.email })
            }
          });
          processedCount++;
        } else if (workflow.actionType === 'SEND_EMAIL') {
          // Safe messaging policy: FR-WF-05 requires explicit authorized configuration
          if (process.env.ENABLE_AUTO_EMAIL === 'true') {
            await sendEmail({
              customerId: customer.id,
              recipientEmail: customer.email,
              recipientName: `${customer.firstName} ${customer.lastName}`,
              subject: actionConfig.subject || 'We miss you!',
              body: actionConfig.body || `Hi ${customer.firstName}, we have new items in stock!`,
              templateId: actionConfig.templateId || null
            });

            await prisma.workflowRun.create({
              data: {
                workflowId: workflow.id,
                status: 'SUCCESS',
                idempotencyKey,
                targetId: customer.id,
                actionTaken: 'SEND_EMAIL',
                details: JSON.stringify({ sentTo: customer.email })
              }
            });
            processedCount++;
          } else {
            await prisma.workflowRun.create({
              data: {
                workflowId: workflow.id,
                status: 'SKIPPED',
                idempotencyKey,
                targetId: customer.id,
                actionTaken: 'SKIPPED_AUTO_EMAIL_DISABLED',
                details: 'Automated email sending is disabled by safety policy (ENABLE_AUTO_EMAIL=false).'
              }
            });
            skippedCount++;
          }
        }
      } catch (err) {
        errorsCount++;
        await prisma.workflowRun.create({
          data: {
            workflowId: workflow.id,
            status: 'FAILED',
            idempotencyKey,
            targetId: customer.id,
            details: `Error: ${err.message}`
          }
        }).catch(() => {});
      }
    }
  }

  await prisma.workflow.update({
    where: { id: workflowId },
    data: { lastRunAt: new Date() }
  });

  return {
    workflowId,
    processedCount,
    skippedCount,
    errorsCount,
    executedAt: new Date()
  };
}

export async function runAllActiveWorkflows() {
  const activeWorkflows = await prisma.workflow.findMany({
    where: { enabled: true }
  });

  const results = [];
  for (const wf of activeWorkflows) {
    try {
      const res = await executeWorkflow(wf.id);
      results.push(res);
    } catch (err) {
      results.push({ workflowId: wf.id, error: err.message });
    }
  }
  return results;
}
