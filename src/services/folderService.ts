import { prisma } from '../lib/prisma';
import { FolderWithChildren } from '../types/frontend';

export async function getFolders(userId: string) {
  const folders = await prisma.folder.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  });

  // Build tree
  const folderMap = new Map<string, FolderWithChildren>();
  const roots: FolderWithChildren[] = [];

  folders.forEach((f) => {
    folderMap.set(f.id, { 
      ...f, 
      created_at: f.created_at.toISOString(),
      updated_at: f.updated_at.toISOString(),
      children: [] 
    });
  });

  folderMap.forEach((folder) => {
    if (folder.parent_id && folderMap.has(folder.parent_id)) {
      folderMap.get(folder.parent_id)!.children.push(folder);
    } else {
      roots.push(folder);
    }
  });

  return roots;
}

export async function createFolder(userId: string, data: { name: string; parent_id?: string | null }) {
  return await prisma.folder.create({
    data: {
      name: data.name,
      parent_id: data.parent_id || null,
      user_id: userId
    }
  });
}

export async function updateFolder(
  id: string,
  userId: string,
  data: { name?: string; parent_id?: string | null }
) {
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder || folder.user_id !== userId) {
    throw new Error('Folder not found or forbidden');
  }

  return await prisma.folder.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.parent_id !== undefined && { parent_id: data.parent_id }),
    }
  });
}

export async function deleteFolder(id: string, userId: string) {
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder || folder.user_id !== userId) {
    throw new Error('Folder not found or forbidden');
  }

  // Move notes in this folder to root, then delete the folder
  await prisma.$transaction([
    prisma.note.updateMany({
      where: { folder_id: id, user_id: userId },
      data: { folder_id: null }
    }),
    prisma.folder.delete({ where: { id } })
  ]);
}
