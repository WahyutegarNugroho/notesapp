import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { supabase } from '../../../../services/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { note: true }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    if (attachment.note.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Extract path from file_url
    const pathParts = attachment.file_url.split('/attachments/');
    if (pathParts.length > 1) {
      const filePath = pathParts[1];
      const { error: storageError } = await supabase.storage.from('attachments').remove([filePath]);
      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }
    }

    await prisma.attachment.delete({ where: { id } });

    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
