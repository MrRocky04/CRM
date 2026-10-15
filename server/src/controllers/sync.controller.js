import * as wooService from '../services/woocommerce.service.js';

export async function getStatus(req, res, next) {
  try {
    const status = await wooService.getSyncStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
}

export async function triggerSync(req, res, next) {
  try {
    const result = await wooService.syncWooCommerceData();
    res.json({
      message: 'Sync completed successfully',
      result
    });
  } catch (err) {
    next(err);
  }
}
