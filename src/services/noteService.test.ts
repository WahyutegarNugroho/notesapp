import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  note: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  tag: {
    findMany: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        remove: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock.supabase.co/storage/v1/object/public/attachments/test.jpg' } })),
      })),
    },
  },
}));

import { getNoteById, createNote, updateNote, deleteNote, restoreNote, getTrashedNotes, permanentDeleteNote } from './noteService';

describe('noteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNoteById', () => {
    it('should return note if owned by user', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        id: '1',
        user_id: 'user-1',
        title: 'Test',
        attachments: [],
        note_tags: [],
      });

      const note = await getNoteById('1', 'user-1');
      expect(note).not.toBeNull();
      expect(note?.title).toBe('Test');
    });

    it('should return null if not owned by user', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        id: '1',
        user_id: 'user-2',
        title: 'Test',
      });

      const note = await getNoteById('1', 'user-1');
      expect(note).toBeNull();
    });

    it('should return null if note not found', async () => {
      mockPrisma.note.findUnique.mockResolvedValue(null);
      const note = await getNoteById('nonexistent', 'user-1');
      expect(note).toBeNull();
    });
  });

  describe('deleteNote (soft delete)', () => {
    it('should set deleted_at', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        id: '1',
        user_id: 'user-1',
      });
      mockPrisma.note.update.mockResolvedValue({ id: '1', deleted_at: new Date() });

      await deleteNote('1', 'user-1');
      expect(mockPrisma.note.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({ deleted_at: expect.any(Date) }),
        })
      );
    });

    it('should throw if not owned by user', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({ id: '1', user_id: 'user-2' });
      await expect(deleteNote('1', 'user-1')).rejects.toThrow('Note not found or forbidden');
    });
  });

  describe('restoreNote', () => {
    it('should set deleted_at to null', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({ id: '1', user_id: 'user-1' });
      mockPrisma.note.update.mockResolvedValue({ id: '1', deleted_at: null });

      await restoreNote('1', 'user-1');
      expect(mockPrisma.note.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: { deleted_at: null },
        })
      );
    });
  });

  describe('createNote', () => {
    it('should create a note without tags', async () => {
      mockPrisma.note.create.mockResolvedValue({
        id: 'new-id',
        title: 'New Note',
        content: null,
        user_id: 'user-1',
        attachments: [],
        note_tags: [],
      });

      const note = await createNote('user-1', { title: 'New Note' });
      expect(note.title).toBe('New Note');
      expect(mockPrisma.note.create).toHaveBeenCalled();
    });

    it('should create a note with tags', async () => {
      mockPrisma.tag.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 1, name: 'tag1', user_id: 'user-1' }]);
      mockPrisma.tag.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.note.create.mockResolvedValue({
        id: 'new-id',
        title: 'Tagged Note',
        user_id: 'user-1',
        attachments: [],
        note_tags: [{ tag: { id: 1, name: 'tag1' } }],
      });

      const note = await createNote('user-1', { title: 'Tagged Note', tags: ['tag1'] });
      expect(note.title).toBe('Tagged Note');
      expect(mockPrisma.tag.createMany).toHaveBeenCalled();
    });
  });

  describe('updateNote', () => {
    it('should update note fields', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({ id: '1', user_id: 'user-1' });
      mockPrisma.note.update.mockResolvedValue({ id: '1', title: 'Updated' });

      const note = await updateNote('1', 'user-1', { title: 'Updated' });
      expect(note.title).toBe('Updated');
    });

    it('should throw if not owned by user', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({ id: '1', user_id: 'user-2' });
      await expect(updateNote('1', 'user-1', { title: 'Hack' })).rejects.toThrow('Note not found or forbidden');
    });
  });

  describe('getTrashedNotes', () => {
    it('should return notes with deleted_at not null', async () => {
      mockPrisma.note.findMany.mockResolvedValue([
        { id: '1', title: 'Trashed', deleted_at: new Date(), attachments: [], note_tags: [] },
      ]);

      const notes = await getTrashedNotes('user-1');
      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe('1');
    });
  });

  describe('permanentDeleteNote', () => {
    it('should delete note and clean up storage', async () => {
      mockPrisma.note.findUnique.mockResolvedValue({
        id: '1',
        user_id: 'user-1',
        content: null,
        attachments: [{ file_url: 'public/attachments/user-1/file.jpg' }],
      });
      mockPrisma.$transaction.mockImplementation(async (tx: (...args: unknown[]) => unknown) => {
        return await tx({ note: { delete: vi.fn() } });
      });

      await permanentDeleteNote('1', 'user-1');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
