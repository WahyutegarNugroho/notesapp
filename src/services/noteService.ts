import { prisma } from '../lib/prisma';
import { supabase } from './supabase';
import { NoteWithRelations } from '../types/frontend';
import type { Prisma } from '../generated/client';
import { extractStoragePathFromUrl, extractStoragePathsFromContent } from '../utils/extractUrls';

export async function getNoteById(id: string, userId: string): Promise<NoteWithRelations | null> {
  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      attachments: true,
      note_tags: {
        include: { tag: true }
      }
    }
  });

  if (!note || note.user_id !== userId) {
    return null;
  }

  return note as unknown as NoteWithRelations;
}

export async function createNote(userId: string, data: { title: string; content?: string; tags?: string[] }) {
  let noteTagsData: Prisma.NoteTagCreateNestedManyWithoutNoteInput | undefined = undefined;

  if (data.tags && data.tags.length > 0) {
    const existingTags = await prisma.tag.findMany({
      where: { user_id: userId, name: { in: data.tags } }
    });
    const existingTagNames = existingTags.map(t => t.name);
    
    const missingTags = data.tags.filter(t => !existingTagNames.includes(t));
    if (missingTags.length > 0) {
      await prisma.tag.createMany({
        data: missingTags.map(t => ({ user_id: userId, name: t }))
      });
    }
    
    const allTags = await prisma.tag.findMany({
      where: { user_id: userId, name: { in: data.tags } }
    });

    noteTagsData = {
      create: allTags.map(t => ({
        tag: { connect: { id: t.id } }
      }))
    };
  }

  const newNote = await prisma.note.create({
    data: {
      title: data.title,
      content: data.content || null,
      user_id: userId,
      note_tags: noteTagsData
    },
    include: {
      attachments: true,
      note_tags: { include: { tag: true } }
    }
  });
  return newNote;
}

export async function updateNote(
  id: string, 
  userId: string, 
  data: { 
    title?: string; 
    content?: string; 
    is_public?: boolean; 
    public_slug?: string | null; 
    folder_id?: string | null; 
    reminder_at?: Date | null; 
  }
) {
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.user_id !== userId) throw new Error('Note not found or forbidden');

  return await prisma.note.update({
    where: { id },
    data,
    include: {
      attachments: true,
      note_tags: { include: { tag: true } }
    }
  });
}

export async function deleteNote(id: string, userId: string): Promise<void> {
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.user_id !== userId) {
    throw new Error('Note not found or forbidden');
  }

  await prisma.note.update({
    where: { id },
    data: { deleted_at: new Date() }
  });
}

export async function restoreNote(id: string, userId: string) {
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.user_id !== userId) {
    throw new Error('Note not found or forbidden');
  }

  return await prisma.note.update({
    where: { id },
    data: { deleted_at: null }
  });
}

export async function getTrashedNotes(userId: string) {
  return await prisma.note.findMany({
    where: { user_id: userId, deleted_at: { not: null } },
    orderBy: { deleted_at: 'desc' },
    include: {
      attachments: true,
      note_tags: { include: { tag: true } }
    }
  });
}

export async function permanentDeleteNote(id: string, userId: string): Promise<void> {
  const note = await prisma.note.findUnique({
    where: { id },
    include: { attachments: true }
  });
  if (!note || note.user_id !== userId) {
    throw new Error('Note not found or forbidden');
  }

  await prisma.$transaction(async (tx) => {
    await tx.note.delete({ where: { id } });
  });

  // Cleanup Storage asynchronously
  try {
    const dbPaths = note.attachments
      .map(att => extractStoragePathFromUrl(att.file_url))
      .filter(Boolean) as string[];

    const inlinePaths = extractStoragePathsFromContent(note.content);

    const allPaths = Array.from(new Set([...dbPaths, ...inlinePaths]));
    if (allPaths.length > 0) {
      const { error: storageError } = await supabase.storage.from('attachments').remove(allPaths);
      if (storageError) {
        console.error("Gagal menghapus file dari Storage:", storageError);
      }
    }
  } catch (err) {
    console.error("Error cleaning up storage for note:", err);
  }
}
