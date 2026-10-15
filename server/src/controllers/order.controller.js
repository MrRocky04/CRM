import * as orderService from '../services/order.service.js';

export async function listOrders(req, res, next) {
  try {
    const result = await orderService.getOrders(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
}
