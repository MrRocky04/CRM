import * as taskService from '../services/task.service.js';

export async function listTasks(req, res, next) {
  try {
    const tasks = await taskService.getTasks(req.query);
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    await taskService.deleteTask(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
}
