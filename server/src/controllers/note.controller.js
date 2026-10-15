import * as noteService from '../services/note.service.js';

export async function listNotes(req, res, next) {
  try {
    const notes = await noteService.getNotesByCustomer(req.params.customerId);
    res.json({ notes });
  } catch (err) {
    next(err);
  }
}

export async function createNote(req, res, next) {
  try {
    const note = await noteService.createNote(req.params.customerId, req.body.content, req.user);
    res.status(201).json({
      message: 'Note created successfully',
      note
    });
  } catch (err) {
    next(err);
  }
}

export async function updateNote(req, res, next) {
  try {
    const note = await noteService.updateNote(req.params.id, req.body.content);
    res.json({
      message: 'Note updated successfully',
      note
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteNote(req, res, next) {
  try {
    await noteService.deleteNote(req.params.id);
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    next(err);
  }
}
