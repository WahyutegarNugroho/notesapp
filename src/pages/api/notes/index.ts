import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { NoteCreateSchema } from '../../../lib/validations';
import { z } from 'zod';
import type { Prisma } from '../../../generated/client';
import { requireAuth } from '../../../lib/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const search = req.query.search as string | undefined;
      const tag = req.query.tag as string | undefined;

      const trashed = req.query.trashed === 'true';
      const whereClause: Prisma.NoteWhereInput = {
        user_id: user.id,
        deleted_at: trashed ? { not: null } : null,
      };

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

      const cursor = req.query.cursor as string | undefined;
      const limit = 10;
      const queryArgs: Prisma.NoteFindManyArgs = {
        where: whereClause,
        take: limit + 1,
        include: {
          attachments: true,
          note_tags: {
            include: { tag: true },
          },
        },
        orderBy: [
          { created_at: 'desc' },
          { id: 'desc' }
        ],
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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Internal Server Error';
      return res.status(500).json({ error: msg });
    }
  }

  if (req.method === 'POST') {
    try {
      const parsedBody = NoteCreateSchema.parse(req.body);
      
      const createData: Prisma.NoteUncheckedCreateInput = {
        title: parsedBody.title,
        content: parsedBody.content,
        user_id: user.id,
      };

      if (parsedBody.tags && parsedBody.tags.length > 0) {
        const existingTags = await prisma.tag.findMany({
          where: {
            user_id: user.id,
            name: { in: parsedBody.tags }
          }
        });
        const existingTagNames = existingTags.map(t => t.name);
        
        const missingTags = parsedBody.tags.filter(t => !existingTagNames.includes(t));
        if (missingTags.length > 0) {
          await prisma.tag.createMany({
            data: missingTags.map(t => ({ user_id: user.id, name: t }))
          });
        }
        
        const allTags = await prisma.tag.findMany({
          where: {
            user_id: user.id,
            name: { in: parsedBody.tags }
          }
        });

        createData.note_tags = {
          create: allTags.map(t => ({
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
