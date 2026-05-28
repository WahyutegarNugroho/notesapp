import { z } from 'zod';
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from '../utils/fileValidator';

const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES] as const;

export const NoteCreateSchema = z.object({
  title: z.string().min(1, 'Judul catatan wajib diisi').max(255, 'Judul terlalu panjang'),
  content: z.string().optional(),
  tags: z.array(z.string().min(1).max(50)).optional().default([])
});

export const NoteUpdateSchema = z.object({
  title: z.string().min(1, 'Judul catatan wajib diisi').max(255, 'Judul terlalu panjang').optional(),
  content: z.string().optional(),
  is_public: z.boolean().optional(),
  public_slug: z.string().max(100).optional().nullable(),
  folder_id: z.string().uuid().nullable().optional(),
  reminder_at: z.string().datetime().nullable().optional(),
});

export const FolderCreateSchema = z.object({
  name: z.string().min(1, 'Nama folder wajib diisi').max(100, 'Nama folder terlalu panjang'),
  parent_id: z.string().uuid('parent_id harus berupa UUID').nullable().optional(),
});

export const AttachmentCreateSchema = z.object({
  note_id: z.string().uuid('note_id harus berupa UUID'),
  file_url: z.string().url('file_url harus URL yang valid'),
  file_type: z.enum(ALLOWED_MIME_TYPES, { message: 'Tipe file tidak didukung' }),
});
