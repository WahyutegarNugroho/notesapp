import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { AttachmentCreateSchema } from '../../../lib/validations';
import { validateUploadRequestSize } from '../../../lib/serverFileValidator';
import { z } from 'zod';
import { requireAuth } from '../../../lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    validateUploadRequestSize(req);

    const parsed = AttachmentCreateSchema.parse(req.body);
    
    // Verifikasi kepemilikan note
    const note = await prisma.note.findUnique({ where: { id: parsed.note_id } });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (note.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const attachment = await prisma.attachment.create({
      data: {
        note_id: parsed.note_id,
        file_url: parsed.file_url,
        file_type: parsed.file_type,
      },
    });

    return res.status(201).json(attachment);
  } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0].message });
      }
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return res.status(500).json({ error: msg });
  }
}
