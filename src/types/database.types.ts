export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          full_name: string | null;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          full_name?: string | null;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          full_name?: string | null;
        };
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id?: string;
          folder_id?: string | null;
          title: string;
          content?: string | null;
          is_public?: boolean;
          public_slug?: string | null;
          reminder_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          folder_id?: string | null;
          title?: string;
          content?: string | null;
          is_public?: boolean;
          public_slug?: string | null;
          reminder_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attachments: {
        Row: {
          id: string;
          note_id: string;
          file_url: string;
          file_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          file_url: string;
          file_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          file_url?: string;
          file_type?: string;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: number;
          user_id: string;
          name: string;
        };
        Insert: {
          id?: never;
          user_id: string;
          name: string;
        };
        Update: {
          id?: never;
          user_id?: string;
          name?: string;
        };
      };
      note_tags: {
        Row: {
          note_id: string;
          tag_id: number;
        };
        Insert: {
          note_id: string;
          tag_id: number;
        };
        Update: {
          note_id?: string;
          tag_id?: number;
        };
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}
