import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { supabase } from '../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
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

  try {
    const { note_id, file_url, file_type } = req.body;
    
    // Verifikasi kepemilikan note
    const note = await prisma.note.findUnique({ where: { id: note_id } });
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (note.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const attachment = await prisma.attachment.create({
      data: {
        note_id,
        file_url,
        file_type,
      },
    });

    return res.status(201).json(attachment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
