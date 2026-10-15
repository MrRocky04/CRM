import * as workflowService from '../services/workflow.service.js';

export async function listWorkflows(req, res, next) {
  try {
    const workflows = await workflowService.getWorkflows();
    res.json({ workflows });
  } catch (err) {
    next(err);
  }
}

export async function getWorkflow(req, res, next) {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id);
    res.json(workflow);
  } catch (err) {
    next(err);
  }
}

export async function createWorkflow(req, res, next) {
  try {
    const workflow = await workflowService.createWorkflow(req.body);
    res.status(201).json({
      message: 'Workflow created successfully',
      workflow
    });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkflow(req, res, next) {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.body);
    res.json({
      message: 'Workflow updated successfully',
      workflow
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkflow(req, res, next) {
  try {
    await workflowService.deleteWorkflow(req.params.id);
    res.json({ message: 'Workflow deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function runWorkflow(req, res, next) {
  try {
    const outcome = await workflowService.executeWorkflow(req.params.id);
    res.json({
      message: 'Workflow executed',
      outcome
    });
  } catch (err) {
    next(err);
  }
}
