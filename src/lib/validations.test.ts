import { describe, it, expect } from 'vitest';
import {
  NoteCreateSchema,
  NoteUpdateSchema,
  FolderCreateSchema,
  AttachmentCreateSchema,
} from './validations';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('NoteCreateSchema', () => {
  it('should accept valid input', () => {
    const result = NoteCreateSchema.safeParse({ title: 'My Note', content: 'Hello' });
    expect(result.success).toBe(true);
  });

  it('should reject empty title', () => {
    const result = NoteCreateSchema.safeParse({ title: '', content: 'Hello' });
    expect(result.success).toBe(false);
  });

  it('should set default tags to empty array', () => {
    const result = NoteCreateSchema.parse({ title: 'Test' });
    expect(result.tags).toEqual([]);
  });
});

describe('NoteUpdateSchema', () => {
  it('should accept partial update', () => {
    const result = NoteUpdateSchema.safeParse({ title: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('should accept empty object (nothing to update)', () => {
    const result = NoteUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject non-boolean is_public', () => {
    const result = NoteUpdateSchema.safeParse({ is_public: 'yes' });
    expect(result.success).toBe(false);
  });

  it('should accept folder_id as UUID', () => {
    const result = NoteUpdateSchema.safeParse({ folder_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it('should reject invalid folder_id', () => {
    const result = NoteUpdateSchema.safeParse({ folder_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('FolderCreateSchema', () => {
  it('should accept valid folder name', () => {
    const result = FolderCreateSchema.safeParse({ name: 'My Folder' });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = FolderCreateSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should accept parent_id as UUID', () => {
    const result = FolderCreateSchema.safeParse({ name: 'Sub', parent_id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it('should reject invalid parent_id', () => {
    const result = FolderCreateSchema.safeParse({ name: 'Sub', parent_id: 'not-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('AttachmentCreateSchema', () => {
  it('should accept valid attachment', () => {
    const result = AttachmentCreateSchema.safeParse({
      note_id: VALID_UUID,
      file_url: 'https://example.com/file.jpg',
      file_type: 'image/jpeg',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid file_type', () => {
    const result = AttachmentCreateSchema.safeParse({
      note_id: VALID_UUID,
      file_url: 'https://example.com/file.jpg',
      file_type: 'application/pdf',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty note_id', () => {
    const result = AttachmentCreateSchema.safeParse({
      note_id: '',
      file_url: 'https://example.com/file.jpg',
      file_type: 'image/jpeg',
    });
    expect(result.success).toBe(false);
  });
});
