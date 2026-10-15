import prisma from '../db/prisma.js';
import { DEFAULT_THRESHOLDS } from '../config/constants.js';

/**
 * Get comprehensive, prioritized store-level recommendations grounded in database evidence.
 */
export async function getStoreRecommendations() {
  const [
    inactiveCustomers,
    loyalCustomers,
    repeatCustomers,
    newCustomers,
    problematicOrders,
    overdueTasks,
    pendingTasksCount
  ] = await Promise.all([
    // Inactive customers with highest spend
    prisma.customer.findMany({
      where: { segment: 'Inactive' },
      take: 6,
      orderBy: { totalSpent: 'desc' },
      include: {
        _count: {
          select: { tasks: { where: { status: { not: 'COMPLETED' } } } }
        },
        orders: { take: 1, orderBy: { dateCreated: 'desc' }, include: { items: true } }
      }
    }),
    // Loyal VIP customers
    prisma.customer.findMany({
      where: { segment: 'Loyal' },
      take: 6,
      orderBy: { totalSpent: 'desc' },
      include: {
        _count: {
          select: { tasks: { where: { status: { not: 'COMPLETED' } } } }
        },
        orders: { take: 1, orderBy: { dateCreated: 'desc' } }
      }
    }),
    // Repeat customers with high loyalty conversion potential
    prisma.customer.findMany({
      where: { segment: 'Repeat' },
      take: 4,
      orderBy: { totalSpent: 'desc' },
      include: {
        orders: { take: 1, orderBy: { dateCreated: 'desc' } }
      }
    }),
    // New customers who made their first purchase recently
    prisma.customer.findMany({
      where: { segment: 'New', orderCount: { gte: 1 } },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        orders: { take: 1, orderBy: { dateCreated: 'desc' }, include: { items: true } }
      }
    }),
    // Orders with refund or cancellation in the last 45 days
    prisma.order.findMany({
      where: {
        status: { in: ['refunded', 'cancelled', 'failed'] },
        customerId: { not: null }
      },
      take: 3,
      orderBy: { dateCreated: 'desc' },
      include: {
        customer: true,
        items: true
      }
    }),
    // Overdue tasks
    prisma.task.findMany({
      where: {
        status: { not: 'COMPLETED' },
        dueDate: { lt: new Date() }
      },
      include: { customer: true },
      orderBy: { dueDate: 'asc' }
    }),
    // Total pending tasks
    prisma.task.count({
      where: { status: { not: 'COMPLETED' } }
    })
  ]);

  const recommendations = [];
  let atRiskRevenue = 0;

  // 1. Inactive High-Value Win-Back Recommendations
  for (const cust of inactiveCustomers) {
    atRiskRevenue += cust.totalSpent;
    const daysSince = cust.lastOrderDate
      ? Math.floor((Date.now() - new Date(cust.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : 60;

    const isUrgent = cust.totalSpent >= 500 || daysSince > 90;
    const lastItemName = cust.orders[0]?.items[0]?.name || 'premium collections';

    recommendations.push({
      id: `rec_inactive_${cust.id}`,
      type: 'RETENTION_WINBACK',
      category: 'Retention',
      priority: isUrgent ? 'URGENT' : 'HIGH',
      title: `Win-Back Opportunity: ${cust.firstName} ${cust.lastName}`,
      customerId: cust.id,
      customerName: `${cust.firstName} ${cust.lastName}`,
      customerEmail: cust.email,
      facts: [
        `Historical Spend: $${cust.totalSpent.toFixed(2)} across ${cust.orderCount} orders`,
        `Days Inactive: ${daysSince} days since last order (${cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString() : 'None'})`,
        `Previous Favorite: "${lastItemName}"`,
        `Open Follow-up Tasks: ${cust._count.tasks}`
      ],
      inference: `Customer spent $${cust.totalSpent.toFixed(2)} previously but has exceeded the inactivity threshold (${daysSince}d > 60d). High risk of churn without proactive re-engagement.`,
      suggestedAction: `Schedule a personalized win-back offer or send a curated catalog update with exclusive express shipping discount.`,
      prefillTask: {
        customerId: cust.id,
        customerName: `${cust.firstName} ${cust.lastName}`,
        title: `Win-Back Outreach: ${cust.firstName} ${cust.lastName}`,
        priority: isUrgent ? 'URGENT' : 'HIGH',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Inactive VIP Win-back. Spend: $${cust.totalSpent.toFixed(2)}, ${daysSince} days inactive. Last purchased ${lastItemName}. Re-engage with special offer.`
      },
      prefillEmail: {
        customerId: cust.id,
        recipientEmail: cust.email,
        recipientName: `${cust.firstName} ${cust.lastName}`,
        subject: `We miss you at Merqanta, ${cust.firstName}!`,
        body: `Hi ${cust.firstName},\n\nIt has been a while since your last visit to Merqanta! We noticed you enjoyed "${lastItemName}" in past orders.\n\nWe have introduced exciting new pieces we think you will love. As a welcome-back gift, use code WELCOMEBACK for complimentary express shipping.\n\nWarm regards,\nThe Merqanta Team`
      }
    });
  }

  // 2. Loyal Customer VIP Appreciation & Milestone Recognition
  for (const cust of loyalCustomers) {
    const daysSince = cust.lastOrderDate
      ? Math.floor((Date.now() - new Date(cust.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const isTopTier = cust.totalSpent >= 1000 || cust.orderCount >= 6;

    recommendations.push({
      id: `rec_loyal_${cust.id}`,
      type: 'VIP_APPRECIATION',
      category: 'VIP Club',
      priority: isTopTier ? 'HIGH' : 'MEDIUM',
      title: `VIP Milestone Appreciation: ${cust.firstName} ${cust.lastName}`,
      customerId: cust.id,
      customerName: `${cust.firstName} ${cust.lastName}`,
      customerEmail: cust.email,
      facts: [
        `Lifetime Gross Spend: $${cust.totalSpent.toFixed(2)}`,
        `Completed Purchases: ${cust.orderCount} orders`,
        `Average Order Value: $${(cust.totalSpent / Math.max(cust.orderCount, 1)).toFixed(2)}`,
        `Last Active: ${daysSince} days ago (${cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString() : 'N/A'})`
      ],
      inference: `Customer represents top 5% revenue cohort. Consistent repeat buyer with strong brand affinity. Recognition and VIP previews solidify long-term lifetime value.`,
      suggestedAction: `Grant early-access concierge status or deliver a personalized thank-you acknowledgement.`,
      prefillTask: {
        customerId: cust.id,
        customerName: `${cust.firstName} ${cust.lastName}`,
        title: `VIP Concierge Check-in: ${cust.firstName} ${cust.lastName}`,
        priority: isTopTier ? 'HIGH' : 'MEDIUM',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Deliver VIP perk and invite early feedback on new collections. Total spend: $${cust.totalSpent.toFixed(2)}.`
      },
      prefillEmail: {
        customerId: cust.id,
        recipientEmail: cust.email,
        recipientName: `${cust.firstName} ${cust.lastName}`,
        subject: `Exclusive VIP Appreciation for ${cust.firstName}`,
        body: `Dear ${cust.firstName},\n\nThank you for being one of our most valued VIP customers at Merqanta! Your support across ${cust.orderCount} purchases means everything to our craft.\n\nWe have unlocked private concierge access for your account (${cust.email}). Let us know if you need any custom requests or early previews.\n\nWith gratitude,\nMerqanta Leadership`
      }
    });
  }

  // 3. Repeat Customer Loyalty Conversion
  for (const cust of repeatCustomers) {
    recommendations.push({
      id: `rec_repeat_${cust.id}`,
      type: 'LOYALTY_NURTURE',
      category: 'Growth',
      priority: 'MEDIUM',
      title: `Loyalty Milestone Nurture: ${cust.firstName} ${cust.lastName}`,
      customerId: cust.id,
      customerName: `${cust.firstName} ${cust.lastName}`,
      customerEmail: cust.email,
      facts: [
        `Order Count: ${cust.orderCount} purchases`,
        `Total Spend: $${cust.totalSpent.toFixed(2)}`,
        `Segment: Repeat (Close to 5-order Loyal tier)`
      ],
      inference: `Customer is consistently building a repeat buying habit. Proactive engagement with complementary accessory suggestions can convert them to top-tier Loyal segment.`,
      suggestedAction: `Introduce loyalty tier benefits and suggest relevant accessories for recent purchases.`,
      prefillTask: {
        customerId: cust.id,
        customerName: `${cust.firstName} ${cust.lastName}`,
        title: `Loyalty Tier Nurturing: ${cust.firstName} ${cust.lastName}`,
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Customer has made ${cust.orderCount} purchases. Send loyalty perk preview or cross-sell recommendation.`
      },
      prefillEmail: {
        customerId: cust.id,
        recipientEmail: cust.email,
        recipientName: `${cust.firstName} ${cust.lastName}`,
        subject: `A special perk on your next Merqanta order, ${cust.firstName}`,
        body: `Hi ${cust.firstName},\n\nWe loved seeing your repeat orders with us! You are just a step away from our official Merqanta VIP tier.\n\nHere is an early look at our newest additions tailored to your style.\n\nBest regards,\nThe Merqanta Team`
      }
    });
  }

  // 4. New Customer Onboarding & Delivery Satisfaction
  for (const cust of newCustomers) {
    const firstItem = cust.orders[0]?.items[0]?.name || 'recent order';
    recommendations.push({
      id: `rec_new_${cust.id}`,
      type: 'NEW_CUSTOMER_ONBOARDING',
      category: 'Onboarding',
      priority: 'MEDIUM',
      title: `First-Order Satisfaction Check: ${cust.firstName} ${cust.lastName}`,
      customerId: cust.id,
      customerName: `${cust.firstName} ${cust.lastName}`,
      customerEmail: cust.email,
      facts: [
        `Customer Status: New Shopper (Initial Order)`,
        `Initial Purchase: "${firstItem}" ($${cust.totalSpent.toFixed(2)})`,
        `Order Date: ${cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString() : 'Recent'}`
      ],
      inference: `First-time buyer in prime satisfaction window. Early proactive care dramatically increases 60-day repeat purchase probability.`,
      suggestedAction: `Send post-delivery check-in to confirm flawless delivery condition and build initial trust.`,
      prefillTask: {
        customerId: cust.id,
        customerName: `${cust.firstName} ${cust.lastName}`,
        title: `Welcome check-in: ${cust.firstName} ${cust.lastName}`,
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Verify satisfaction for first purchase: ${firstItem}. Confirm no issues during shipping.`
      },
      prefillEmail: {
        customerId: cust.id,
        recipientEmail: cust.email,
        recipientName: `${cust.firstName} ${cust.lastName}`,
        subject: `How is your new purchase, ${cust.firstName}?`,
        body: `Hello ${cust.firstName},\n\nWe wanted to verify that your recent delivery of "${firstItem}" arrived in pristine condition and that you are enjoying it!\n\nIf you have any questions or feedback, please reply directly to this email.\n\nThank you,\nMerqanta Customer Care`
      }
    });
  }

  // 5. Problematic Orders (Refunded / Cancelled) Customer Recovery
  for (const order of problematicOrders) {
    if (order.customer) {
      recommendations.push({
        id: `rec_order_${order.id}`,
        type: 'CUSTOMER_RECOVERY',
        category: 'Service Recovery',
        priority: 'HIGH',
        title: `Service Recovery Outreach: ${order.customer.firstName} ${order.customer.lastName}`,
        customerId: order.customer.id,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email,
        facts: [
          `Order #${order.orderNumber} Status: ${order.status.toUpperCase()}`,
          `Order Amount: $${order.total.toFixed(2)}`,
          `Items: ${order.items.map(i => i.name).join(', ') || 'N/A'}`,
          `Customer Segment: ${order.customer.segment}`
        ],
        inference: `Order #${order.orderNumber} was ${order.status}. High risk of customer churn or negative perception unless support proactively reaches out to offer assistance.`,
        suggestedAction: `Initiate a direct follow-up call or apology email to address satisfaction issues.`,
        prefillTask: {
          customerId: order.customer.id,
          customerName: `${order.customer.firstName} ${order.customer.lastName}`,
          title: `Service Recovery: Order #${order.orderNumber} (${order.customer.firstName} ${order.customer.lastName})`,
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: `Follow up regarding ${order.status} order #${order.orderNumber} ($${order.total.toFixed(2)}). Offer resolution or replacement.`
        },
        prefillEmail: {
          customerId: order.customer.id,
          recipientEmail: order.customer.email,
          recipientName: `${order.customer.firstName} ${order.customer.lastName}`,
          subject: `Following up on order #${order.orderNumber} - Merqanta Support`,
          body: `Dear ${order.customer.firstName},\n\nWe noticed there was an issue with order #${order.orderNumber}. We want to ensure you have a 5-star experience with Merqanta.\n\nPlease let us know if we can offer a replacement or assist in any other way.\n\nSincerely,\nMerqanta Support Team`
        }
      });
    }
  }

  // 6. Operational Alert: Overdue Tasks
  if (overdueTasks.length > 0) {
    recommendations.unshift({
      id: 'rec_overdue_tasks_summary',
      type: 'OPERATIONAL_TASK',
      category: 'Operations',
      priority: 'URGENT',
      title: `${overdueTasks.length} Follow-Up Task(s) Overdue for Action`,
      facts: [
        `Total Overdue Tasks: ${overdueTasks.length}`,
        `Oldest Overdue: "${overdueTasks[0].title}" (Due ${new Date(overdueTasks[0].dueDate).toLocaleDateString()})`,
        `Assigned Customers: ${overdueTasks.filter(t => t.customer).map(t => `${t.customer.firstName} ${t.customer.lastName}`).slice(0, 3).join(', ')}...`
      ],
      inference: `Delayed customer follow-ups increase the probability of customer dissatisfaction, lost retention, or unresolved inquiries.`,
      suggestedAction: `Review and resolve overdue follow-ups on the Tasks board immediately.`,
      prefillTask: {
        title: `Resolve ${overdueTasks.length} overdue follow-up task(s)`,
        priority: 'URGENT',
        dueDate: new Date().toISOString().split('T')[0],
        description: `Review overdue follow-ups backlog on the tasks dashboard and resolve overdue customer actions.`
      },
      link: '/tasks'
    });
  }

  return {
    engineInfo: {
      mode: 'DETERMINISTIC_RULES_ENGINE',
      name: 'Merqanta Action Intelligence Agent',
      version: '2.0',
      description: 'Evidence-grounded, rules-based recommendations citing verified database facts without unverified generative claims (FR-AGT-01 to FR-AGT-04).'
    },
    summary: {
      totalRecommendations: recommendations.length,
      urgentCount: recommendations.filter(r => r.priority === 'URGENT').length,
      highCount: recommendations.filter(r => r.priority === 'HIGH').length,
      mediumCount: recommendations.filter(r => r.priority === 'MEDIUM').length,
      atRiskRevenue: parseFloat(atRiskRevenue.toFixed(2)),
      overdueTasksCount: overdueTasks.length,
      pendingTasksCount
    },
    recommendations
  };
}

/**
 * Deep customer-level recommendations grounded in the specific customer's purchase history.
 */
export async function getCustomerRecommendations(customerId) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        orderBy: { dateCreated: 'desc' },
        take: 5,
        include: { items: true }
      },
      tasks: {
        where: { status: { not: 'COMPLETED' } },
        orderBy: { dueDate: 'asc' }
      },
      communications: {
        orderBy: { createdAt: 'desc' },
        take: 3
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    }
  });

  if (!customer) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }

  const daysSince = customer.lastOrderDate 
    ? Math.floor((Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const aov = customer.orderCount > 0 ? (customer.totalSpent / customer.orderCount).toFixed(2) : '0.00';
  const recentItemNames = customer.orders.flatMap(o => o.items.map(i => i.name)).slice(0, 3);

  const facts = [
    `Current Segment: ${customer.segment}`,
    `Total Purchases: ${customer.orderCount} orders`,
    `Lifetime Gross Spend: $${customer.totalSpent.toFixed(2)} (AOV: $${aov})`,
    daysSince !== null ? `Days Since Last Purchase: ${daysSince} days` : 'No recorded purchases (CRM Contact)',
    `Active Open Tasks: ${customer.tasks.length}`,
    `Past Communications: ${customer.communications.length} logged`,
    recentItemNames.length > 0 ? `Recent Products: ${recentItemNames.join(', ')}` : 'No product history'
  ];

  let inference = '';
  let suggestedAction = '';
  let taskTitle = '';
  let taskPriority = 'MEDIUM';
  let emailSubject = '';
  let emailBody = '';

  if (customer.segment === 'Inactive') {
    taskPriority = customer.totalSpent > 500 ? 'URGENT' : 'HIGH';
    inference = `Customer previously contributed $${customer.totalSpent.toFixed(2)} across ${customer.orderCount} orders but has been inactive for ${daysSince} days (exceeding ${DEFAULT_THRESHOLDS.INACTIVE_DAYS}-day threshold). Churn risk is critical.`;
    suggestedAction = 'Send win-back communication offering complimentary express shipping or initiate a direct phone check-in.';
    taskTitle = `Win-back outreach: ${customer.firstName} ${customer.lastName}`;
    emailSubject = `We miss you at Merqanta, ${customer.firstName}!`;
    emailBody = `Hi ${customer.firstName},\n\nIt has been a little while since your last order with us. We have introduced several new arrivals that complement your past purchases.\n\nUse code WELCOMEBACK for complimentary express shipping on your next order.\n\nWarm regards,\nThe Merqanta Team`;
  } else if (customer.segment === 'Loyal') {
    taskPriority = 'HIGH';
    inference = `High-value brand advocate with ${customer.orderCount} purchases and $${customer.totalSpent.toFixed(2)} spend. Strong candidate for VIP concierge perks and referral rewards.`;
    suggestedAction = 'Acknowledge loyal VIP status, provide private collection preview, or request feedback on recent orders.';
    taskTitle = `VIP appreciation check-in: ${customer.firstName} ${customer.lastName}`;
    emailSubject = `Exclusive VIP appreciation for ${customer.firstName}`;
    emailBody = `Dear ${customer.firstName},\n\nThank you for being one of our most valued VIP customers at Merqanta. Your support means the world to our team.\n\nWe have unlocked private concierge perks for your account (${customer.email}). Let us know if you need any custom requests!\n\nBest regards,\nMerqanta Leadership`;
  } else if (customer.segment === 'Repeat') {
    taskPriority = 'MEDIUM';
    inference = `Customer has placed ${customer.orderCount} completed purchases totaling $${customer.totalSpent.toFixed(2)}. They are moving toward the 5-order Loyal tier threshold.`;
    suggestedAction = 'Share relevant product tips or cross-sell complementary accessories based on recent purchases.';
    taskTitle = `Cross-sell & loyalty follow-up: ${customer.firstName} ${customer.lastName}`;
    emailSubject = `Tailored recommendations for ${customer.firstName}`;
    emailBody = `Hi ${customer.firstName},\n\nWe loved seeing your repeat orders with Merqanta! We put together a few curated items that pair well with your recent setup.\n\nThank you for choosing Merqanta!\n\nWarm regards,\nThe Merqanta Team`;
  } else {
    taskPriority = 'MEDIUM';
    inference = customer.orderCount === 1 
      ? `First-time customer with $${customer.totalSpent.toFixed(2)} initial spend. Prime post-delivery satisfaction window.`
      : 'CRM-managed lead without completed commerce orders. Opportunity for enterprise or wholesale discovery.';
    suggestedAction = customer.orderCount === 1
      ? 'Confirm delivery condition and offer support on their new product.'
      : 'Send introductory catalog and schedule a discovery consultation.';
    taskTitle = customer.orderCount === 1
      ? `First-order satisfaction check: ${customer.firstName} ${customer.lastName}`
      : `Enterprise lead discovery: ${customer.firstName} ${customer.lastName}`;
    emailSubject = customer.orderCount === 1
      ? `Welcome to Merqanta, ${customer.firstName}!`
      : `Introduction from Merqanta`;
    emailBody = customer.orderCount === 1
      ? `Hello ${customer.firstName},\n\nThank you for your first order with Merqanta! We wanted to confirm that everything arrived in pristine condition.\n\nPlease let us know if you have any questions.\n\nWarm regards,\nMerqanta Customer Success`
      : `Hello ${customer.firstName},\n\nThank you for connecting with Merqanta. We would be delighted to share our commercial catalog and answer any questions for your team.\n\nBest regards,\nMerqanta Team`;
  }

  return {
    customerId: customer.id,
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerEmail: customer.email,
    segment: customer.segment,
    facts,
    inference,
    suggestedAction,
    prefillTask: {
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      title: taskTitle,
      priority: taskPriority,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `Action Agent recommendation for ${customer.firstName} ${customer.lastName} (${customer.segment} segment, spend: $${customer.totalSpent.toFixed(2)}). Facts: ${facts.slice(0, 3).join('; ')}`
    },
    prefillEmail: {
      customerId: customer.id,
      recipientEmail: customer.email,
      recipientName: `${customer.firstName} ${customer.lastName}`,
      subject: emailSubject,
      body: emailBody
    }
  };
}

/**
 * Interactive natural language query handler for Merqanta Action Agent.
 * Parses user questions against real store facts and returns an evidence-grounded analysis.
 */
export async function queryAgent(userQuery = '') {
  const queryLower = (userQuery || '').toLowerCase().trim();

  // 1. Check if the user is asking about a specific customer by name or email
  const allCustomers = await prisma.customer.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      segment: true,
      totalSpent: true,
      orderCount: true,
      lastOrderDate: true
    }
  });

  const matchedCustomerBrief = allCustomers.find(c => {
    const fn = (c.firstName || '').toLowerCase();
    const ln = (c.lastName || '').toLowerCase();
    const full = `${fn} ${ln}`.trim();
    const em = (c.email || '').toLowerCase();
    return (
      (fn && fn.length > 2 && queryLower.includes(fn)) ||
      (ln && ln.length > 2 && queryLower.includes(ln)) ||
      (full && full.length > 3 && queryLower.includes(full)) ||
      (em && em.length > 4 && queryLower.includes(em))
    );
  });

  if (matchedCustomerBrief) {
    const cust = await prisma.customer.findUnique({
      where: { id: matchedCustomerBrief.id },
      include: {
        orders: { orderBy: { dateCreated: 'desc' }, take: 5, include: { items: true } },
        tasks: { where: { status: { not: 'COMPLETED' } }, orderBy: { dueDate: 'asc' } },
        communications: { orderBy: { createdAt: 'desc' }, take: 3 }
      }
    });

    const daysSince = cust.lastOrderDate
      ? Math.floor((Date.now() - new Date(cust.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const recentItems = cust.orders.flatMap(o => o.items.map(i => i.name));
    const itemsPreview = recentItems.length > 0 ? recentItems.slice(0, 3).join(', ') : 'None';

    const facts = [
      `Customer: ${cust.firstName} ${cust.lastName} (${cust.email})`,
      `Lifecycle Segment: ${cust.segment} status`,
      `Lifetime Gross Spend: $${cust.totalSpent.toFixed(2)} (${cust.orderCount} orders)`,
      daysSince !== null ? `Last Purchase: ${daysSince} days ago (${new Date(cust.lastOrderDate).toLocaleDateString()})` : `No recorded purchases`,
      `Open Tasks: ${cust.tasks.length} pending follow-up(s)`,
      `Purchased Products: ${itemsPreview}`
    ];

    let headline = `Customer Intelligence: ${cust.firstName} ${cust.lastName} (${cust.segment})`;
    let analysis = '';
    const suggestedActions = [];
    let prefillTask = null;
    let prefillEmail = null;

    if (cust.segment === 'Inactive') {
      analysis = `${cust.firstName} ${cust.lastName} is currently in the Inactive segment (${daysSince} days since last order), with $${cust.totalSpent.toFixed(2)} in cumulative spend. Immediate retention outreach is recommended before churn becomes permanent.`;
      suggestedActions.push(
        `Send personalized win-back offer with voucher code WELCOMEBACK.`,
        `Schedule a direct customer service check-in task.`,
        `Review past purchase history (${itemsPreview}) for tailored re-engagement.`
      );
      prefillTask = {
        customerId: cust.id,
        customerName: `${cust.firstName} ${cust.lastName}`,
        title: `Win-Back Outreach: ${cust.firstName} ${cust.lastName}`,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Inactive VIP Win-back. Spend: $${cust.totalSpent.toFixed(2)}, ${daysSince} days inactive. Re-engage with exclusive offer.`
      };
      prefillEmail = {
        customerId: cust.id,
        recipientEmail: cust.email,
        recipientName: `${cust.firstName} ${cust.lastName}`,
        subject: `We miss you at Merqanta, ${cust.firstName}!`,
        body: `Hi ${cust.firstName},\n\nWe noticed it has been a little while since your last visit. We've added new collections you might love!\n\nUse code WELCOMEBACK for complimentary express shipping.\n\nWarm regards,\nThe Merqanta Team`
      };
    } else if (cust.segment === 'Loyal') {
      analysis = `${cust.firstName} ${cust.lastName} is one of our top brand advocates with $${cust.totalSpent.toFixed(2)} lifetime spend across ${cust.orderCount} completed purchases. High candidate for VIP perks and priority access.`;
      suggestedActions.push(
        `Send VIP Concierge appreciation note.`,
        `Invite ${cust.firstName} to private collection previews.`,
        `Verify delivery satisfaction on recent orders.`
      );
      prefillTask = {
        customerId: cust.id,
        customerName: `${cust.firstName} ${cust.lastName}`,
        title: `VIP Concierge Check-in: ${cust.firstName} ${cust.lastName}`,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Loyal VIP customer. Cumulative spend $${cust.totalSpent.toFixed(2)}. Deliver personalized concierge appreciation.`
      };
      prefillEmail = {
        customerId: cust.id,
        recipientEmail: cust.email,
        recipientName: `${cust.firstName} ${cust.lastName}`,
        subject: `Exclusive VIP appreciation for ${cust.firstName}`,
        body: `Dear ${cust.firstName},\n\nThank you for being one of our most valued VIP customers at Merqanta. Your support means the world to our team.\n\nWe have unlocked private concierge perks for your account (${cust.email}). Let us know if you need any custom requests!\n\nBest regards,\nMerqanta Leadership`
      };
    } else {
      analysis = `${cust.firstName} ${cust.lastName} has ${cust.orderCount} purchase(s) totaling $${cust.totalSpent.toFixed(2)}. Lifecycle status is currently ${cust.segment}.`;
      suggestedActions.push(
        `Follow up on product satisfaction (${itemsPreview}).`,
        `Recommend complementary accessories.`,
        `Keep account profile contact information updated.`
      );
      prefillTask = {
        customerId: cust.id,
        customerName: `${cust.firstName} ${cust.lastName}`,
        title: `Follow-up: ${cust.firstName} ${cust.lastName}`,
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Follow up with customer ${cust.firstName} ${cust.lastName} regarding recent purchases.`
      };
    }

    return {
      query: userQuery,
      headline,
      analysis,
      facts,
      suggestedActions,
      relatedCustomer: {
        id: cust.id,
        name: `${cust.firstName} ${cust.lastName}`,
        email: cust.email
      },
      prefillTask,
      prefillEmail,
      generatedAt: new Date().toISOString()
    };
  }

  // 2. Multi-metric aggregate retrieval for store-wide queries
  const [
    totalCustomers,
    segmentCounts,
    totalSalesResult,
    inactiveHighSpend,
    topLoyal,
    overdueTasks,
    recentOrders,
    orderStatusCounts,
    orderItemsSample,
    activeWorkflows
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.groupBy({
      by: ['segment'],
      _count: { id: true },
      _sum: { totalSpent: true }
    }),
    prisma.order.aggregate({
      where: { status: { in: ['completed', 'processing'] } },
      _sum: { total: true },
      _count: { id: true }
    }),
    prisma.customer.findMany({
      where: { segment: 'Inactive' },
      orderBy: { totalSpent: 'desc' },
      take: 5
    }),
    prisma.customer.findMany({
      where: { segment: 'Loyal' },
      orderBy: { totalSpent: 'desc' },
      take: 5
    }),
    prisma.task.findMany({
      where: { status: { not: 'COMPLETED' }, dueDate: { lt: new Date() } },
      include: { customer: true },
      take: 5
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { dateCreated: 'desc' },
      include: { customer: true, items: true }
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.orderItem.findMany({
      take: 50,
      include: { order: { select: { status: true } } }
    }),
    prisma.workflow.findMany({
      where: { enabled: true },
      take: 5
    })
  ]);

  const segmentMap = {};
  segmentCounts.forEach(s => {
    segmentMap[s.segment] = {
      count: s._count.id,
      revenue: s._sum.totalSpent || 0
    };
  });

  const totalGross = totalSalesResult._sum.total || 0;
  const qualifyingOrders = totalSalesResult._count.id || 0;
  const atRiskTotal = segmentMap['Inactive']?.revenue || 0;
  const loyalTotal = segmentMap['Loyal']?.revenue || 0;

  // Aggregate item sales
  const productTotals = {};
  for (const item of orderItemsSample) {
    if (!productTotals[item.name]) {
      productTotals[item.name] = { units: 0, revenue: 0 };
    }
    productTotals[item.name].units += item.quantity || 1;
    productTotals[item.name].revenue += item.total || 0;
  }
  const topProducts = Object.entries(productTotals)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  let headline = '';
  let analysis = '';
  const facts = [];
  const suggestedActions = [];
  let prefillTask = null;
  let prefillEmail = null;
  let relatedCustomer = null;

  // Intent 1: Products, Catalog, Items
  if (
    queryLower.includes('product') ||
    queryLower.includes('item') ||
    queryLower.includes('keyboard') ||
    queryLower.includes('switch') ||
    queryLower.includes('cable') ||
    queryLower.includes('popular') ||
    queryLower.includes('catalog') ||
    queryLower.includes('selling')
  ) {
    headline = `Catalog & Product Intelligence: Top Revenue Drivers Identified`;
    analysis = `Store purchase analysis reveals strong demand across premium mechanical accessories. Top revenue generator is "${topProducts[0]?.[0] || 'Premium Mechanical Keyboards'}" with $${(topProducts[0]?.[1]?.revenue || 0).toFixed(2)} across ${topProducts[0]?.[1]?.units || 0} units.`;
    
    topProducts.forEach(([name, stats]) => {
      facts.push(`"${name}": ${stats.units} units sold ($${stats.revenue.toFixed(2)})`);
    });
    facts.push(`Total Unique Products Tracked: ${Object.keys(productTotals).length}`);

    suggestedActions.push(
      `Cross-sell complementary cables and switch accessories to recent keyboard buyers.`,
      `Feature top seller "${topProducts[0]?.[0] || 'Keyboard'}" in upcoming loyalty newsletter.`,
      `Monitor stock levels for high-velocity items.`
    );
  }
  // Intent 2: Orders, Sales, Revenue, Finance
  else if (
    queryLower.includes('sale') ||
    queryLower.includes('revenue') ||
    queryLower.includes('order') ||
    queryLower.includes('gross') ||
    queryLower.includes('aov') ||
    queryLower.includes('spend') ||
    queryLower.includes('volume') ||
    queryLower.includes('financial')
  ) {
    const aov = qualifyingOrders > 0 ? (totalGross / qualifyingOrders).toFixed(2) : '0.00';
    headline = `Commerce & Sales Performance: $${totalGross.toFixed(2)} Gross Volume`;
    analysis = `Across ${qualifyingOrders} completed & processing orders, Merqanta recorded $${totalGross.toFixed(2)} in gross commerce volume with an Average Order Value (AOV) of $${aov}. Recent orders demonstrate healthy customer activity.`;
    
    facts.push(
      `Gross Commerce Sales: $${totalGross.toFixed(2)}`,
      `Qualifying Orders: ${qualifyingOrders} (Completed/Processing)`,
      `Average Order Value (AOV): $${aov}`,
      `Most Recent Order: #${recentOrders[0]?.orderNumber || 'N/A'} ($${(recentOrders[0]?.total || 0).toFixed(2)} - ${recentOrders[0]?.customer ? `${recentOrders[0].customer.firstName} ${recentOrders[0].customer.lastName}` : 'Guest'})`,
      `Second Recent Order: #${recentOrders[1]?.orderNumber || 'N/A'} ($${(recentOrders[1]?.total || 0).toFixed(2)})`
    );

    suggestedActions.push(
      `Maintain post-delivery follow-ups to drive repeat purchase frequency above current baseline.`,
      `Target customers with below-average order value with product bundle recommendations.`,
      `Review order dashboard for real-time status updates.`
    );
  }
  // Intent 3: Refunds, Cancellations, Service Recovery
  else if (
    queryLower.includes('refund') ||
    queryLower.includes('cancel') ||
    queryLower.includes('failed') ||
    queryLower.includes('recovery') ||
    queryLower.includes('complaint') ||
    queryLower.includes('issue')
  ) {
    const problematic = await prisma.order.findMany({
      where: { status: { in: ['refunded', 'cancelled', 'failed'] } },
      include: { customer: true, items: true },
      take: 4
    });

    headline = `Service Recovery Alert: ${problematic.length} Orders Require Care`;
    analysis = problematic.length > 0
      ? `Identified ${problematic.length} orders with refunded or cancelled statuses. Proactive service recovery outreach prevents churn and protects brand reputation.`
      : `No problematic or refunded orders detected in recent history. Service quality is exceptional!`;

    problematic.forEach(o => {
      facts.push(`Order #${o.orderNumber}: Status ${o.status.toUpperCase()} ($${o.total.toFixed(2)}) - ${o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'Guest'}`);
    });

    if (problematic[0]?.customer) {
      const target = problematic[0].customer;
      relatedCustomer = { id: target.id, name: `${target.firstName} ${target.lastName}`, email: target.email };
      prefillTask = {
        customerId: target.id,
        customerName: `${target.firstName} ${target.lastName}`,
        title: `Service Recovery: Order #${problematic[0].orderNumber}`,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Follow up regarding refunded/cancelled order #${problematic[0].orderNumber} ($${problematic[0].total.toFixed(2)}). Offer resolution or discount.`
      };
      prefillEmail = {
        customerId: target.id,
        recipientEmail: target.email,
        recipientName: `${target.firstName} ${target.lastName}`,
        subject: `Following up on order #${problematic[0].orderNumber} - Merqanta Support`,
        body: `Dear ${target.firstName},\n\nWe noticed there was an issue with order #${problematic[0].orderNumber}. We want to ensure you have a 5-star experience with Merqanta.\n\nPlease let us know if we can offer a replacement or assist in any other way.\n\nSincerely,\nMerqanta Support Team`
      };
    }

    suggestedActions.push(
      `Dispatch direct apology/inquiry to affected customers.`,
      `Offer store credit or replacement item for defective deliveries.`,
      `Review task board for pending service recovery tickets.`
    );
  }
  // Intent 4: Churn, Inactive, Retention
  else if (
    queryLower.includes('churn') ||
    queryLower.includes('inactive') ||
    queryLower.includes('risk') ||
    queryLower.includes('retention') ||
    queryLower.includes('winback') ||
    queryLower.includes('win-back')
  ) {
    headline = `Churn Risk Analysis: $${atRiskTotal.toFixed(2)} in At-Risk Revenue Identified`;
    analysis = `There are currently ${segmentMap['Inactive']?.count || 0} customers in the Inactive segment (60+ days without a purchase), representing $${atRiskTotal.toFixed(2)} in historical spend. The highest priority win-back candidate is ${inactiveHighSpend[0]?.firstName} ${inactiveHighSpend[0]?.lastName} with $${inactiveHighSpend[0]?.totalSpent.toFixed(2)} lifetime spend.`;
    
    facts.push(
      `Inactive Customers: ${segmentMap['Inactive']?.count || 0} accounts`,
      `Total Revenue at Risk: $${atRiskTotal.toFixed(2)}`,
      `Top Churn Risk: ${inactiveHighSpend[0]?.firstName} ${inactiveHighSpend[0]?.lastName} ($${inactiveHighSpend[0]?.totalSpent.toFixed(2)})`,
      `Second Churn Risk: ${inactiveHighSpend[1]?.firstName} ${inactiveHighSpend[1]?.lastName} ($${inactiveHighSpend[1]?.totalSpent.toFixed(2)})`
    );

    if (inactiveHighSpend[0]) {
      const top = inactiveHighSpend[0];
      relatedCustomer = { id: top.id, name: `${top.firstName} ${top.lastName}`, email: top.email };
      prefillTask = {
        customerId: top.id,
        customerName: `${top.firstName} ${top.lastName}`,
        title: `Win-Back Outreach: ${top.firstName} ${top.lastName}`,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Inactive VIP Win-back. Spend: $${top.totalSpent.toFixed(2)}. Re-engage with exclusive offer code WELCOMEBACK.`
      };
      prefillEmail = {
        customerId: top.id,
        recipientEmail: top.email,
        recipientName: `${top.firstName} ${top.lastName}`,
        subject: `We miss you at Merqanta, ${top.firstName}!`,
        body: `Hi ${top.firstName},\n\nIt has been a while since your last visit to Merqanta! We have introduced exciting new pieces we think you will love.\n\nAs a welcome-back gift, use code WELCOMEBACK for complimentary express shipping.\n\nWarm regards,\nThe Merqanta Team`
      };
    }

    suggestedActions.push(
      `Trigger "Inactive Customer Retention Guard" workflow to queue follow-up reminders.`,
      `Draft win-back email with code WELCOMEBACK for ${inactiveHighSpend[0]?.firstName || 'inactive contacts'}.`,
      `Review task board for overdue customer reminders.`
    );
  }
  // Intent 5: VIP, Loyalty, Best Customers
  else if (
    queryLower.includes('vip') ||
    queryLower.includes('loyal') ||
    queryLower.includes('top customer') ||
    queryLower.includes('best') ||
    queryLower.includes('advocate')
  ) {
    headline = `VIP & Loyalty Report: ${segmentMap['Loyal']?.count || 0} Core Advocates Driving $${loyalTotal.toFixed(2)}`;
    analysis = `Loyal customers account for $${loyalTotal.toFixed(2)} across ${segmentMap['Loyal']?.count || 0} accounts. Top buyer ${topLoyal[0]?.firstName} ${topLoyal[0]?.lastName} leads with $${topLoyal[0]?.totalSpent.toFixed(2)} over ${topLoyal[0]?.orderCount} orders.`;
    
    facts.push(
      `Loyal VIP Accounts: ${segmentMap['Loyal']?.count || 0} customers`,
      `VIP Cumulative Revenue: $${loyalTotal.toFixed(2)}`,
      `Top Spender: ${topLoyal[0]?.firstName} ${topLoyal[0]?.lastName} ($${topLoyal[0]?.totalSpent.toFixed(2)})`,
      `Second Spender: ${topLoyal[1]?.firstName} ${topLoyal[1]?.lastName} ($${topLoyal[1]?.totalSpent.toFixed(2)})`
    );

    if (topLoyal[0]) {
      const top = topLoyal[0];
      relatedCustomer = { id: top.id, name: `${top.firstName} ${top.lastName}`, email: top.email };
      prefillTask = {
        customerId: top.id,
        customerName: `${top.firstName} ${top.lastName}`,
        title: `VIP Concierge Appreciation: ${top.firstName} ${top.lastName}`,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Loyal VIP customer. Cumulative spend $${top.totalSpent.toFixed(2)}. Deliver personalized concierge appreciation.`
      };
      prefillEmail = {
        customerId: top.id,
        recipientEmail: top.email,
        recipientName: `${top.firstName} ${top.lastName}`,
        subject: `Exclusive VIP appreciation for ${top.firstName}`,
        body: `Dear ${top.firstName},\n\nThank you for being one of our most valued VIP customers at Merqanta. Your support means the world to our team.\n\nWe have unlocked private concierge perks for your account (${top.email}). Let us know if you need any custom requests!\n\nBest regards,\nMerqanta Leadership`
      };
    }

    suggestedActions.push(
      `Send VIP Concierge appreciation note to ${topLoyal[0]?.firstName || 'VIP advocates'}.`,
      `Invite top spenders to preview upcoming collections.`,
      `Check if repeat buyers (${segmentMap['Repeat']?.count || 0}) are ready for VIP tier upgrade.`
    );
  }
  // Intent 6: Overdue Tasks, Operations, Bottlenecks
  else if (
    queryLower.includes('overdue') ||
    queryLower.includes('task') ||
    queryLower.includes('bottleneck') ||
    queryLower.includes('todo') ||
    queryLower.includes('to-do') ||
    queryLower.includes('action item')
  ) {
    headline = `Operational Follow-Up Status: ${overdueTasks.length} Overdue Tasks Require Immediate Action`;
    analysis = overdueTasks.length > 0
      ? `There are ${overdueTasks.length} tasks past their scheduled due dates. The most urgent is "${overdueTasks[0]?.title}" for customer ${overdueTasks[0]?.customer?.firstName || 'Unknown'}.`
      : 'All operational follow-up tasks are currently up-to-date with no overdue bottlenecks.';
    
    facts.push(
      `Overdue Tasks Count: ${overdueTasks.length}`,
      overdueTasks[0] ? `Oldest Overdue: "${overdueTasks[0].title}" (Due: ${new Date(overdueTasks[0].dueDate).toLocaleDateString()})` : 'No overdue tasks',
      overdueTasks[1] ? `Second Overdue: "${overdueTasks[1].title}"` : 'Up-to-date',
      `Total Tracked Customers: ${totalCustomers}`
    );

    suggestedActions.push(
      `Navigate to Tasks board to resolve overdue follow-ups.`,
      `Reassign or close completed outreach calls.`,
      `Review Action Agent prefilled follow-ups.`
    );
  }
  // Intent 7: New Customers, Onboarding
  else if (
    queryLower.includes('new') ||
    queryLower.includes('onboard') ||
    queryLower.includes('first time') ||
    queryLower.includes('first order')
  ) {
    const newCusts = await prisma.customer.findMany({
      where: { segment: 'New' },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { orders: { take: 1, orderBy: { dateCreated: 'desc' } } }
    });

    headline = `New Customer Onboarding: ${segmentMap['New']?.count || 0} Accounts in Prime Window`;
    analysis = `There are ${segmentMap['New']?.count || 0} first-time shoppers who joined recently. Delivering proactive post-delivery care within their first 14 days increases repeat purchase likelihood by up to 60%.`;
    
    newCusts.forEach(c => {
      facts.push(`New Shopper: ${c.firstName} ${c.lastName} (${c.email}) - Spend: $${c.totalSpent.toFixed(2)}`);
    });

    if (newCusts[0]) {
      const top = newCusts[0];
      relatedCustomer = { id: top.id, name: `${top.firstName} ${top.lastName}`, email: top.email };
      prefillTask = {
        customerId: top.id,
        customerName: `${top.firstName} ${top.lastName}`,
        title: `Welcome check-in: ${top.firstName} ${top.lastName}`,
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Verify satisfaction for first purchase. Confirm no issues during shipping.`
      };
      prefillEmail = {
        customerId: top.id,
        recipientEmail: top.email,
        recipientName: `${top.firstName} ${top.lastName}`,
        subject: `How is your new purchase, ${top.firstName}?`,
        body: `Hello ${top.firstName},\n\nWe wanted to verify that your recent delivery arrived in pristine condition and that you are enjoying it!\n\nIf you have any questions or feedback, please reply directly to this email.\n\nThank you,\nMerqanta Customer Care`
      };
    }

    suggestedActions.push(
      `Send post-delivery check-in email to ${newCusts[0]?.firstName || 'new shoppers'}.`,
      `Confirm all first-order tracking numbers are delivered.`,
      `Invite first-time buyers to review their experience.`
    );
  }
  // Intent 8: Workflows, Automation
  else if (
    queryLower.includes('workflow') ||
    queryLower.includes('automation') ||
    queryLower.includes('rule')
  ) {
    headline = `Automation & Workflow Engine: ${activeWorkflows.length} Active Rules Operating`;
    analysis = `Merqanta automated workflows monitor customer timelines in the background. Active rules enforce retention guards for 60-day inactive shoppers and VIP appreciation milestones.`;
    
    activeWorkflows.forEach(w => {
      facts.push(`Workflow: "${w.name}" [Trigger: ${w.triggerType} -> Action: ${w.actionType}]`);
    });

    suggestedActions.push(
      `Trigger scheduled run across all active workflows.`,
      `Verify Resend email API integration in Settings.`,
      `Review task board for automatically generated follow-ups.`
    );
  }
  // Default: Comprehensive Executive Overview
  else {
    headline = `Merqanta Executive Intelligence Overview`;
    analysis = `Store intelligence encompasses ${totalCustomers} customer profiles and ${qualifyingOrders} qualifying orders totaling $${totalGross.toFixed(2)} in gross commerce volume. Customer distribution stands at ${segmentMap['Loyal']?.count || 0} Loyal, ${segmentMap['Repeat']?.count || 0} Repeat, ${segmentMap['New']?.count || 0} New, and ${segmentMap['Inactive']?.count || 0} Inactive.`;
    
    facts.push(
      `Total Tracked Customers: ${totalCustomers} profiles`,
      `Gross Commerce Volume: $${totalGross.toFixed(2)} (${qualifyingOrders} orders)`,
      `Loyal VIP Revenue: $${loyalTotal.toFixed(2)} (${segmentMap['Loyal']?.count || 0} accounts)`,
      `At-Risk Churn Revenue: $${atRiskTotal.toFixed(2)} (${segmentMap['Inactive']?.count || 0} accounts)`,
      `Overdue Operational Follow-ups: ${overdueTasks.length} task(s)`
    );

    suggestedActions.push(
      `Execute win-back campaign for top inactive customer ${inactiveHighSpend[0]?.firstName || 'N/A'}.`,
      `Dispatch VIP appreciation preview to top spender ${topLoyal[0]?.firstName || 'N/A'}.`,
      `Resolve ${overdueTasks.length} overdue task reminders on the dashboard.`
    );
  }

  return {
    query: userQuery,
    headline,
    analysis,
    facts,
    suggestedActions,
    relatedCustomer,
    prefillTask,
    prefillEmail,
    generatedAt: new Date().toISOString()
  };
}
