import * as templateService from '../services/template.service.js';

export async function listTemplates(req, res, next) {
  try {
    const templates = await templateService.getTemplates();
    res.json({ templates });
  } catch (err) {
    next(err);
  }
}

export async function getTemplate(req, res, next) {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    res.json(template);
  } catch (err) {
    next(err);
  }
}

export async function createTemplate(req, res, next) {
  try {
    const template = await templateService.createTemplate(req.body);
    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTemplate(req, res, next) {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body);
    res.json({
      message: 'Template updated successfully',
      template
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTemplate(req, res, next) {
  try {
    await templateService.deleteTemplate(req.params.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    next(err);
  }
}
