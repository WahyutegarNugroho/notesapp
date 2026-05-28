import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';
import { apiLimiter, authLimiter } from './rateLimiter';

const AUTH_PATHS = ['/api/login', '/api/register', '/api/forgot-password', '/api/reset-password'];

function getIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || '127.0.0.1';
}

export async function requireAuth(req: NextApiRequest, res: NextApiResponse): Promise<User | null> {
  const ip = getIp(req);
  const path = req.url || '';

  const isAuthPath = AUTH_PATHS.some(p => path.startsWith(p));
  const limiter = isAuthPath ? authLimiter : apiLimiter;
  const { allowed } = limiter(ip);

  if (!allowed) {
    res.status(429).json({ error: 'Too many requests. Silakan coba lagi nanti.' });
    return null;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  return user;
}
