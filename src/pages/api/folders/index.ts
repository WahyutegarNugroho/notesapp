import type { NextApiRequest, NextApiResponse } from 'next';
import { FolderCreateSchema } from '../../../lib/validations';
import { z } from 'zod';
import { requireAuth } from '../../../lib/apiAuth';
import { getFolders, createFolder } from '../../../services/folderService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const folders = await getFolders(user.id);
      return res.status(200).json(folders);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Internal Server Error';
      return res.status(500).json({ error: msg });
    }
  }

  if (req.method === 'POST') {
    try {
      const parsed = FolderCreateSchema.parse(req.body);
      const folder = await createFolder(user.id, parsed);
      return res.status(201).json(folder);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0].message });
      }
      const msg = error instanceof Error ? error.message : 'Internal Server Error';
      return res.status(500).json({ error: msg });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
