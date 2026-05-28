const SUPABASE_URL_REGEX = /https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/attachments\/([^"'\s]+)/g;

export function extractStoragePathsFromContent(content: string | null): string[] {
  if (!content) return [];
  const paths: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = SUPABASE_URL_REGEX.exec(content)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

export function extractStoragePathFromUrl(fileUrl: string): string | null {
  const match = fileUrl.match(/public\/attachments\/(.+)$/);
  return match ? match[1] : null;
}
