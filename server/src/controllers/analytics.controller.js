import * as analyticsService from '../services/analytics.service.js';

export async function getOverview(req, res, next) {
  try {
    const data = await analyticsService.getDashboardOverview();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getRetention(req, res, next) {
  try {
    const timeRange = req.query.timeRange || '90d';
    const data = await analyticsService.getRetentionAnalytics(timeRange);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
