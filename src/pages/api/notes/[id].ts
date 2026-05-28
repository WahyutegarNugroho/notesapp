import type { NextApiRequest, NextApiResponse } from 'next';
import { NoteUpdateSchema } from '../../../lib/validations';
import { z } from 'zod';
import { requireAuth } from '../../../lib/apiAuth';
import { getNoteById, updateNote, deleteNote, restoreNote, permanentDeleteNote } from '../../../services/noteService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const note = await getNoteById(id, user.id);
      if (!note) return res.status(404).json({ error: 'Note not found' });
      return res.status(200).json(note);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Internal Server Error';
      return res.status(500).json({ error: msg });
    }
  }

  if (req.method === 'PUT') {
    if (req.query.action === 'restore') {
      try {
        const note = await restoreNote(id, user.id);
        return res.status(200).json(note);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Internal Server Error';
        return res.status(500).json({ error: msg });
      }
    }

    try {
      const parsed = NoteUpdateSchema.parse(req.body);
      const dataToUpdate: Record<string, string | boolean | Date | null> = {};
      
      if (parsed.title !== undefined) dataToUpdate.title = parsed.title;
      if (parsed.content !== undefined) dataToUpdate.content = parsed.content;
      if (parsed.is_public !== undefined) dataToUpdate.is_public = parsed.is_public;
      if (parsed.public_slug !== undefined) dataToUpdate.public_slug = parsed.public_slug;
      if (parsed.folder_id !== undefined) dataToUpdate.folder_id = parsed.folder_id;
      if (parsed.reminder_at !== undefined) dataToUpdate.reminder_at = parsed.reminder_at ? new Date(parsed.reminder_at) : null;

      const note = await updateNote(id, user.id, dataToUpdate);
      return res.status(200).json(note);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0].message });
      }
      const msg = error instanceof Error ? error.message : 'Internal Server Error';
      return res.status(500).json({ error: msg });
    }
  }

  if (req.method === 'DELETE') {
    if (req.query.permanent === 'true') {
      try {
        await permanentDeleteNote(id, user.id);
        return res.status(204).end();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Internal Server Error';
        return res.status(500).json({ error: msg });
      }
    }

    try {
      await deleteNote(id, user.id);
      return res.status(204).end();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Internal Server Error';
      return res.status(500).json({ error: msg });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
