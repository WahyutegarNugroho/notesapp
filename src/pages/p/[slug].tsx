import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { prisma } from '../../lib/prisma';
import { BookText } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { TagBadge } from '../../components/features/TagBadge';
import { MediaPreview } from '../../components/features/MediaPreview';
import Link from 'next/link';

interface PublicNoteProps {
  note: any; // Using any for simplicity in serializable format
  error?: string;
}

export default function PublicNote({ note, error }: PublicNoteProps) {
  if (error || !note) {
    return (
      <div className="min-h-screen bg-card flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="text-muted-foreground mb-6">
            Catatan tidak ditemukan atau tidak lagi dibagikan ke publik.
          </p>
          <Link href="/">
            <span className="text-primary hover:underline">Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>{note.title} | Notes App (Publik)</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        {/* Simple Header */}
        <div className="flex items-center justify-center mb-10">
          <div className="bg-primary p-2 rounded-lg mr-3">
            <BookText className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">Notes<span className="text-primary">App</span></span>
        </div>

        <div className="bg-background rounded-2xl shadow-xl shadow-zinc-200/20 dark:shadow-none border border-border overflow-hidden">
          <div className="p-8 sm:p-12">
            <h1 className="text-4xl font-extrabold text-foreground mb-4 tracking-tight leading-tight">
              {note.title}
            </h1>
            <div className="text-sm font-medium text-muted-foreground mb-10 pb-6 border-b border-border">
              Terakhir diubah: {format(new Date(note.updated_at), 'd MMMM yyyy, HH:mm', { locale: idLocale })}
            </div>

            <div 
              className="prose prose-zinc dark:prose-invert max-w-none mb-12 text-muted-foreground leading-relaxed text-lg tiptap-content"
              dangerouslySetInnerHTML={{ __html: note.content || '<span class="italic opacity-60">Tidak ada isi catatan.</span>' }}
            />

            {/* Tags */}
            {note.note_tags && note.note_tags.length > 0 && (
              <div className="mb-12">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Tag</h3>
                <div className="flex flex-wrap gap-2">
                  {note.note_tags.map((nt: any) => (
                    <TagBadge key={nt.tag.id} name={nt.tag.name} />
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {note.attachments && note.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                  Lampiran ({note.attachments.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {note.attachments.map((att: any) => (
                    <div key={att.id} className="relative rounded-xl overflow-hidden border border-border">
                      <MediaPreview fileUrl={att.file_url} fileType={att.file_type} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Banner */}
          <div className="bg-muted/50 p-6 text-center border-t border-border">
            <p className="text-sm text-muted-foreground">
              Catatan ini dibagikan secara publik menggunakan <span className="font-semibold text-foreground">Notes App</span>.
            </p>
            <Link href="/">
              <span className="inline-block mt-2 text-primary hover:text-primary font-medium text-sm">
                Buat catatan Anda sendiri gratis &rarr;
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  try {
    const note = await prisma.note.findUnique({
      where: { public_slug: slug },
      include: {
        attachments: true,
        note_tags: {
          include: { tag: true }
        }
      }
    });

    if (!note || !note.is_public) {
      return { props: { error: 'Not found' } };
    }

    // Convert dates to strings for Next.js JSON serialization
    const safeNote = {
      ...note,
      created_at: note.created_at.toISOString(),
      updated_at: note.updated_at.toISOString(),
      attachments: note.attachments.map(a => ({
        ...a,
        created_at: a.created_at.toISOString(),
      }))
    };

    return {
      props: {
        note: safeNote
      }
    };
  } catch (error) {
    return { props: { error: 'Internal Server Error' } };
  }
};
