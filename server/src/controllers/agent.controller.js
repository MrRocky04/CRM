import * as agentService from '../services/agent.service.js';

export async function getStoreRecommendations(req, res, next) {
  try {
    const data = await agentService.getStoreRecommendations();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerRecommendations(req, res, next) {
  try {
    const data = await agentService.getCustomerRecommendations(req.params.customerId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function queryAgent(req, res, next) {
  try {
    const { query } = req.body || {};
    const data = await agentService.queryAgent(query);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
