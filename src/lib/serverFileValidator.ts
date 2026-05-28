import type { NextApiRequest } from 'next';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function validateUploadRequestSize(req: NextApiRequest): void {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File terlalu besar. Maksimal 10MB.`);
  }
}
