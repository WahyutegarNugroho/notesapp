import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  folder: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  note: {
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { getFolders, createFolder, updateFolder, deleteFolder } from './folderService';

describe('folderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFolders', () => {
    it('should build tree from flat list', async () => {
      const now = new Date();
      mockPrisma.folder.findMany.mockResolvedValue([
        { id: '1', user_id: 'u1', name: 'Root', parent_id: null, created_at: now, updated_at: now },
        { id: '2', user_id: 'u1', name: 'Child', parent_id: '1', created_at: now, updated_at: now },
      ]);

      const trees = await getFolders('u1');
      expect(trees).toHaveLength(1);
      expect(trees[0].name).toBe('Root');
      expect(trees[0].children).toHaveLength(1);
      expect(trees[0].children[0].name).toBe('Child');
    });

    it('should return empty array for user with no folders', async () => {
      mockPrisma.folder.findMany.mockResolvedValue([]);
      const trees = await getFolders('u1');
      expect(trees).toEqual([]);
    });
  });

  describe('createFolder', () => {
    it('should create a root folder', async () => {
      mockPrisma.folder.create.mockResolvedValue({
        id: 'new-folder',
        name: 'Work',
        parent_id: null,
        user_id: 'u1',
      });

      const folder = await createFolder('u1', { name: 'Work' });
      expect(folder.name).toBe('Work');
      expect(folder.parent_id).toBeNull();
    });

    it('should create a subfolder', async () => {
      mockPrisma.folder.create.mockResolvedValue({
        id: 'sub-folder',
        name: 'Sub',
        parent_id: 'parent-id',
        user_id: 'u1',
      });

      const folder = await createFolder('u1', { name: 'Sub', parent_id: 'parent-id' });
      expect(folder.parent_id).toBe('parent-id');
    });
  });

  describe('updateFolder', () => {
    it('should rename a folder', async () => {
      mockPrisma.folder.findUnique.mockResolvedValue({ id: '1', user_id: 'u1' });
      mockPrisma.folder.update.mockResolvedValue({ id: '1', name: 'Renamed' });

      const folder = await updateFolder('1', 'u1', { name: 'Renamed' });
      expect(folder.name).toBe('Renamed');
    });

    it('should throw if not owned', async () => {
      mockPrisma.folder.findUnique.mockResolvedValue({ id: '1', user_id: 'u2' });
      await expect(updateFolder('1', 'u1', { name: 'Hack' })).rejects.toThrow('Folder not found or forbidden');
    });
  });

  describe('deleteFolder', () => {
    it('should move notes to root and delete folder', async () => {
      mockPrisma.folder.findUnique.mockResolvedValue({ id: '1', user_id: 'u1' });
      mockPrisma.$transaction.mockResolvedValue([{ count: 2 }, {}]);

      await deleteFolder('1', 'u1');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
