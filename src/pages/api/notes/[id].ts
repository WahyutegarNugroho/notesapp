import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { supabase } from '../../../services/supabase';
import { NoteUpdateSchema } from '../../../lib/validations';
import { z } from 'zod';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const existingNote = await prisma.note.findUnique({ 
    where: { id },
    include: { attachments: true }
  });
  if (!existingNote) {
    return res.status(404).json({ error: 'Note not found' });
  }
  if (existingNote.user_id !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'PUT') {
    try {
      const { title, content, is_public, public_slug, folder_id, reminder_at } = req.body;
      let dataToUpdate: any = {};
      if (title !== undefined) dataToUpdate.title = title;
      if (content !== undefined) dataToUpdate.content = content;
      if (is_public !== undefined) dataToUpdate.is_public = is_public;
      if (public_slug !== undefined) dataToUpdate.public_slug = public_slug;
      if (folder_id !== undefined) dataToUpdate.folder_id = folder_id;
      if (reminder_at !== undefined) dataToUpdate.reminder_at = reminder_at ? new Date(reminder_at) : null;

      const note = await prisma.note.update({
        where: { id },
        data: dataToUpdate,
        include: {
          attachments: true,
          note_tags: {
            include: { tag: true },
          },
        }
      });
      return res.status(200).json(note);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: (error as any).errors[0].message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Ekstrak file path dari tabel attachments
      const dbPaths = existingNote.attachments
        .map(att => {
          const match = att.file_url.match(/public\/attachments\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      // Ekstrak file path dari inline images di dalam HTML content
      const inlinePaths: string[] = [];
      if (existingNote.content) {
        const urlRegex = /https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/attachments\/([^"'\s]+)/g;
        let match;
        while ((match = urlRegex.exec(existingNote.content)) !== null) {
          inlinePaths.push(match[1]);
        }
      }

      // Hapus duplikat dan eksekusi penghapusan storage Supabase
      const allPaths = Array.from(new Set([...dbPaths, ...inlinePaths]));
      if (allPaths.length > 0) {
        const { error: storageError } = await supabase.storage.from('attachments').remove(allPaths);
        if (storageError) {
          console.error("Gagal menghapus file dari Storage:", storageError);
        }
      }

      await prisma.note.delete({ where: { id } });
      return res.status(204).end();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
