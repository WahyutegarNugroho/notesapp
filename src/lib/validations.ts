import { z } from 'zod';

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
});
