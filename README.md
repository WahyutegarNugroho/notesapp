# 📝 MyNotes App

**Nama project:** MyNotes App — Aplikasi Catatan Berbasis Web

**Deskripsi singkat:**  
MyNotes adalah aplikasi catatan online full-stack yang memungkinkan pengguna membuat, mengedit, mengelola, dan berbagi catatan dengan format rich text. Dibangun menggunakan Next.js, Supabase, dan Prisma, aplikasi ini mendukung organisasi folder, tagging, lampiran file, dark mode, serta ekspor catatan ke Markdown/PDF.

**Problem yang diselesaikan:**  
- Pengguna membutuhkan aplikasi catatan yang cepat, modern, dan bisa diakses dari mana saja via browser
- Catatan biasa (plain text) tidak cukup — perlu dukungan rich text, checklist, gambar, dan video
- Kesulitan mengorganisir catatan dalam jumlah banyak — solusi dengan folder bersarang dan tagging
- Kebutuhan berbagi catatan secara publik tanpa harus membuat akun untuk pembaca
- File attachment yang memakan penyimpanan lokal — solusi dengan cloud storage (Supabase Storage)

**Fitur utama:**  
- ✨ Rich text editor (Tiptap) — bold, italic, strikethrough, heading, bullet list, numbered list, task list
- 📂 Organisasi folder (nested/hierarchical)
- 🏷️ Tagging catatan dengan filter tag
- 🔗 Berbagi catatan publik via link unik (`/p/[slug]`)
- 📎 Lampirkan gambar (JPEG/PNG/WebP) dan video (MP4/WebM) — otomatis dikompres
- 🔍 Pencarian catatan (judul & isi) dengan debounce
- ⏰ Pengingat (reminder) dengan date-time picker
- 📤 Ekspor catatan ke Markdown (`.md`) atau PDF
- 🔗 Note linking — ketik `[` untuk mention/link ke catatan lain
- 🗑️ Soft-delete & trash — restore atau hapus permanen
- 🌙 Dark mode + 5 tema kustom (Default, Dracula, Nord, Sepia, Ocean)
- 🔐 Autentikasi email/password (Supabase Auth) — login, register, forgot/reset password
- ⚡ Infinite scroll dengan cursor-based pagination
- 🧹 Pembersihan file orphan di storage otomatis via cron endpoint

**Kelebihan:**  
- ✅ Full-stack dalam satu repo — mudah deploy
- ✅ Rich text editor yang powerful (Tiptap v3)
- ✅ Performance cepat dengan SWR + infinite scroll
- ✅ Dark mode dan multiple themes
- ✅ Keamanan: rate limiting, validasi Zod, session-based auth
- ✅ Fitur ekspor Markdown & PDF built-in

**Kekurangan:**  
- ❌ Belum ada mode offline / PWA
- ❌ Belum ada kolaborasi real-time (multi-user edit)
- ❌ Belum ada dukungan mobile app native
- ❌ Masih menggunakan Pages Router (belum migrasi ke App Router)

**Tech Stack & Alasan:**

| Teknologi | Kegunaan | Alasan |
|---|---|---|
| **Next.js 16** (Pages Router) | Framework React full-stack | SSR, routing, API routes dalam satu project |
| **TypeScript** | Bahasa pemrograman | Type safety, maintainability |
| **Prisma 7** | ORM / database | Type-safe query, migration mudah, support PostgreSQL |
| **Supabase** (Auth + Storage + PostgreSQL) | Backend as a Service | Auth siap pakai, storage file, database managed |
| **Tailwind CSS v4** | Utility CSS framework | Styling cepat, konsisten, mudah dikustom |
| **shadcn/ui** | Komponen UI | Aksesible, kustomizable, tidak berat |
| **Tiptap v3** | Rich text editor | Ekstensibel, berbasis ProseMirror, ringan |
| **SWR v2** | Data fetching / caching | Revalidasi otomatis, caching, infinite scroll |
| **Zod v4** | Validasi data | Type-safe, skema validasi runtime |
| **date-fns v4** | Manipulasi tanggal | Tree-shakeable, dukungan locale Indonesia |
| **Vitest** | Unit testing | Cepat, kompatibel dengan Vite/Next.js |

**Cara Install / Run:**

1. **Clone repositori**
   ```bash
   git clone https://github.com/WahyutegarNugroho/notesapp.git
   cd notesapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Buat project Supabase**  
   Daftar/login di [supabase.com](https://supabase.com), buat project baru.

4. **Konfigurasi environment variables**  
   Salin `.env.example` ke `.env` dan isi dengan credential Supabase-mu:
   ```bash
   cp .env.example .env
   ```

5. **Jalankan migrasi database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000)

7. **Build untuk production**
   ```bash
   npm run build
   npm start
   ```

**Testing:**
```bash
npm test          # Jalankan unit tests
npm run lint      # Cek kode dengan ESLint
```
