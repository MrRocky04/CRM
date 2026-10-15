import * as customerService from '../services/customer.service.js';

export async function listCustomers(req, res, next) {
  try {
    const result = await customerService.getCustomers(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCustomer(req, res, next) {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.json(customer);
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const customer = await customerService.createCrmCustomer(req.body);
    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (err) {
    next(err);
  }
}
