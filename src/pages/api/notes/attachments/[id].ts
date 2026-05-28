import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { supabase } from '../../../../services/supabase';
import { requireAuth } from '../../../../lib/apiAuth';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { id } = req.query;
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

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

    // Extract path from file_url (validate to prevent path traversal)
    const urlObj = new URL(attachment.file_url);
    const pathMatch = urlObj.pathname.match(/\/attachments\/(.+)$/);
    if (pathMatch) {
      const filePath = pathMatch[1];
      if (filePath.includes('..')) {
        return res.status(400).json({ error: 'Invalid file path' });
      }
      const { error: storageError } = await supabase.storage.from('attachments').remove([filePath]);
      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }
    }

    await prisma.attachment.delete({ where: { id } });

    res.status(200).json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ error: msg });
  }
}
