import { PrismaClient } from './src/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// We need to use dotenv since it's a standalone script
import 'dotenv/config';
import 'dotenv/config'; // Next.js .env.local isn't loaded by default in node

import * as fs from 'fs';
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("Adding RLS policy for Supabase storage...");
    
    // Policy for INSERT
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public insert to attachments" 
      ON storage.objects FOR INSERT 
      TO public 
      WITH CHECK (bucket_id = 'attachments');
    `);
    
    // Policy for SELECT
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public select from attachments" 
      ON storage.objects FOR SELECT 
      TO public 
      USING (bucket_id = 'attachments');
    `);

    // Policy for UPDATE
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public update to attachments" 
      ON storage.objects FOR UPDATE 
      TO public 
      USING (bucket_id = 'attachments');
    `);

    // Policy for DELETE
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public delete from attachments" 
      ON storage.objects FOR DELETE 
      TO public 
      USING (bucket_id = 'attachments');
    `);
    
    console.log("Successfully created policies!");
  } catch (error) {
    console.error("Error creating policies. They might already exist. Details:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
