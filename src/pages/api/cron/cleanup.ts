import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { supabase } from '../../../services/supabase';

// Harus dipanggil dengan CRON_SECRET agar tidak bisa di-trigger sembarang orang
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Jika Anda mengonfigurasi Vercel Cron, mereka akan mengirim Authorization header khusus
  // Untuk kesederhanaan, kita bisa menggunakan token statis di .env
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized Cron Trigger' });
  }

  try {
    // 1. Ambil semua file yang ada di Supabase Storage (attachments bucket)
    // Supabase JS library hanya bisa melist per folder/path, jadi ini disederhanakan
    // Pada skala produksi, Anda perlu melakukan iterasi (pagination) untuk setiap folder (user_id).
    
    // Sebagai kerangka kerja dasar, kita simulasikan sukses
    // Implementasi nyata membutuhkan:
    // a. supabase.storage.from('attachments').list() rekursif
    // b. prisma.attachment.findMany()
    // c. prisma.note.findMany() -> ekstrak URL dari konten
    // d. Filter file yang ada di (a) tapi tidak ada di (b) dan (c)
    // e. supabase.storage.from('attachments').remove(orphans)

    // Simulasi respons sukses untuk demonstrasi
    return res.status(200).json({ 
      success: true, 
      message: 'Cron job cleanup endpoint siap diimplementasikan secara penuh. Saat ini sistem mengandalkan penghapusan sinkron (langsung saat catatan dihapus).' 
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
