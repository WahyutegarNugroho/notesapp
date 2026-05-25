import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { supabase } from '../../../services/supabase';
import { NoteCreateSchema } from '../../../lib/validations';
import { z } from 'zod';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const search = req.query.search as string;
      const tag = req.query.tag as string;

      const whereClause: any = { user_id: user.id };

      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (tag) {
        whereClause.note_tags = {
          some: {
            tag: { name: tag }
          }
        };
      }

      const cursor = req.query.cursor as string;
      const limit = 10;
      const queryArgs: any = {
        where: whereClause,
        take: limit + 1,
        include: {
          attachments: true,
          note_tags: {
            include: { tag: true },
          },
        },
        orderBy: { created_at: 'desc' },
      };

      if (cursor) {
        queryArgs.cursor = { id: cursor };
      }

      const notes = await prisma.note.findMany(queryArgs);
      
      let nextCursor: string | null = null;
      if (notes.length > limit) {
        const nextItem = notes.pop();
        nextCursor = nextItem!.id;
      }
      
      return res.status(200).json({ notes, nextCursor });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const parsedBody = NoteCreateSchema.parse(req.body);
      
      const createData: any = {
        title: parsedBody.title,
        content: parsedBody.content,
        user_id: user.id,
      };

      if (parsedBody.tags && parsedBody.tags.length > 0) {
        // Cari tag yang sudah ada untuk user ini
        const existingTags = await prisma.tag.findMany({
          where: {
            user_id: user.id,
            name: { in: parsedBody.tags }
          }
        });
        const existingTagNames = existingTags.map((t: any) => t.name);
        
        // Buat tag yang belum ada
        const missingTags = parsedBody.tags.filter((t: string) => !existingTagNames.includes(t));
        if (missingTags.length > 0) {
          await prisma.tag.createMany({
            data: missingTags.map((t: string) => ({ user_id: user.id, name: t }))
          });
        }
        
        // Ambil semua tag (baik yang baru dibuat maupun yang sudah ada)
        const allTags = await prisma.tag.findMany({
          where: {
            user_id: user.id,
            name: { in: parsedBody.tags }
          }
        });

        createData.note_tags = {
          create: allTags.map((t: any) => ({
            tag: {
              connect: { id: t.id }
            }
          }))
        };
      }

      const note = await prisma.note.create({
        data: createData,
        include: {
          attachments: true,
          note_tags: {
            include: { tag: true },
          },
        }
      });
      return res.status(201).json(note);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: (error as any).errors[0].message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
