export interface NoteWithRelations {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: string | null;
  is_public: boolean;
  public_slug: string | null;
  reminder_at: string | null;
  created_at: string;
  updated_at: string;
  attachments: SerializedAttachment[];
  note_tags: SerializedNoteTag[];
}

export interface SerializedAttachment {
  id: string;
  note_id: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export interface SerializedNoteTag {
  note_id: string;
  tag_id: number;
  tag: SerializedTag;
}

export interface SerializedTag {
  id: number;
  user_id: string;
  name: string;
}

export interface FolderWithChildren {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  children: FolderWithChildren[];
}
