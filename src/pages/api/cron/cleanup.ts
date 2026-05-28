import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { supabase } from '../../../services/supabase';
import { extractStoragePathFromUrl, extractStoragePathsFromContent } from '../../../utils/extractUrls';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized Cron Trigger' });
  }

  try {
    const allNotes = await prisma.note.findMany({
      select: { id: true, content: true, user_id: true }
    });

    const allAttachments = await prisma.attachment.findMany({
      select: { id: true, file_url: true, note_id: true }
    });

    const dbPaths = new Set(
      allAttachments
        .map(a => extractStoragePathFromUrl(a.file_url))
        .filter(Boolean) as string[]
    );

    const inlinePaths = new Set<string>();
    for (const note of allNotes) {
      const paths = extractStoragePathsFromContent(note.content);
      for (const p of paths) inlinePaths.add(p);
    }

    const activePaths = new Set([...dbPaths, ...inlinePaths]);

    const userIds = [...new Set(allNotes.map(n => n.user_id))];

    const storagePaths: string[] = [];

    for (const userId of userIds) {
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const { data: files, error: listError } = await supabase.storage
          .from('attachments')
          .list(userId, { limit, offset, sortBy: { column: 'name', order: 'asc' } });

        if (listError) {
          console.error(`Error listing storage for user ${userId}:`, listError);
          break;
        }

        if (!files || files.length === 0) {
          hasMore = false;
        } else {
          for (const file of files) {
            if (file.name === '.emptyFolderPlaceholder') continue;
            const fullPath = `${userId}/${file.name}`;
            storagePaths.push(fullPath);
          }
          offset += files.filter(f => f.name !== '.emptyFolderPlaceholder').length;
          if (files.length < limit) hasMore = false;
        }
      }
    }

    const orphanPaths = storagePaths.filter(p => !activePaths.has(p));

    const deletedPaths: string[] = [];
    if (orphanPaths.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < orphanPaths.length; i += batchSize) {
        const batch = orphanPaths.slice(i, i + batchSize);
        const { error: removeError } = await supabase.storage
          .from('attachments')
          .remove(batch);

        if (removeError) {
          console.error(`Error removing batch starting at index ${i}:`, removeError);
        } else {
          deletedPaths.push(...batch);
        }
      }
    }

    return res.status(200).json({
      success: true,
      totalStorageFiles: storagePaths.length,
      totalActivePaths: activePaths.size,
      orphansFound: orphanPaths.length,
      deletedCount: deletedPaths.length,
      deletedPaths: deletedPaths.slice(0, 20),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return res.status(500).json({ error: msg });
  }
}
