import { describe, it, expect } from 'vitest';
import { extractStoragePathsFromContent, extractStoragePathFromUrl } from './extractUrls';

describe('extractStoragePathsFromContent', () => {
  it('should extract supabase storage URLs from HTML content', () => {
    const content = `<p>Check this image:</p><img src="https://xyzproject.supabase.co/storage/v1/object/public/attachments/user-1/file.jpg" />`;
    const paths = extractStoragePathsFromContent(content);
    expect(paths).toEqual(['user-1/file.jpg']);
  });

  it('should return empty array for null content', () => {
    expect(extractStoragePathsFromContent(null)).toEqual([]);
  });

  it('should return empty array for content without storage URLs', () => {
    const content = '<p>No images here</p>';
    expect(extractStoragePathsFromContent(content)).toEqual([]);
  });

  it('should extract multiple URLs', () => {
    const content = `
      <img src="https://abc.supabase.co/storage/v1/object/public/attachments/u1/a.jpg" />
      <img src="https://abc.supabase.co/storage/v1/object/public/attachments/u1/b.jpg" />
    `;
    const paths = extractStoragePathsFromContent(content);
    expect(paths).toHaveLength(2);
    expect(paths).toContain('u1/a.jpg');
    expect(paths).toContain('u1/b.jpg');
  });
});

describe('extractStoragePathFromUrl', () => {
  it('should extract path from public URL', () => {
    const path = extractStoragePathFromUrl('https://xyz.supabase.co/storage/v1/object/public/attachments/user-1/file.jpg');
    expect(path).toBe('user-1/file.jpg');
  });

  it('should return null for non-matching URL', () => {
    expect(extractStoragePathFromUrl('https://example.com/file.jpg')).toBeNull();
  });
});
