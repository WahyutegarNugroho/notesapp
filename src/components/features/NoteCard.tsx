import React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { NoteWithDetails } from '../../hooks/useNotes';
import { TagBadge } from './TagBadge';
import { Image as ImageIcon, Video } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface NoteCardProps {
  note: NoteWithDetails;
  onClick: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  const hasImages = note.attachments.some(a => a.file_type.startsWith('image/'));
  const hasVideos = note.attachments.some(a => a.file_type.startsWith('video/'));

  return (
    <Card 
      onClick={onClick}
      className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col group overflow-hidden border-border bg-background/60 backdrop-blur-md"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-xl leading-tight line-clamp-2 group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">
          {note.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow pb-4">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
          {note.content ? note.content.replace(/<[^>]+>/g, '') : <span className="italic opacity-60">Tidak ada deskripsi</span>}
        </p>

        {(hasImages || hasVideos) && (
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground mb-4">
            {hasImages && (
              <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md">
                <ImageIcon className="w-3.5 h-3.5 text-primary" /> Gambar
              </span>
            )}
            {hasVideos && (
              <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md">
                <Video className="w-3.5 h-3.5 text-rose-500" /> Video
              </span>
            )}
          </div>
        )}

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map(tag => (
              <TagBadge key={tag.id} name={tag.name} />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-4 text-[11px] text-muted-foreground font-medium">
        {format(new Date(note.created_at), 'd MMM yyyy, HH:mm', { locale: id })}
      </CardFooter>
    </Card>
  );
};
