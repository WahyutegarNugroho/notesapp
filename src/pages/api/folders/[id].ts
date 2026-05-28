import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/apiAuth';
import { updateFolder, deleteFolder } from '../../../services/folderService';
import { FolderCreateSchema } from '../../../lib/validations';
import { z } from 'zod';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'PUT') {
    try {
      const parsed = FolderCreateSchema.partial().parse(req.body);
      const folder = await updateFolder(id, user.id, parsed);
      return res.status(200).json(folder);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0].message });
      }
      const msg = error instanceof Error ? error.message : 'Internal Server Error';
      return res.status(500).json({ error: msg });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await deleteFolder(id, user.id);
      return res.status(204).end();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Internal Server Error';
      return res.status(500).json({ error: msg });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
