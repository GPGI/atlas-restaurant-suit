import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client only if credentials are available
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Database types
export interface Database {
  public: {
    Tables: {
      tables: {
        Row: {
          id: string;
          table_id: string;
          is_locked: boolean;
          is_vip: boolean;
          cart: any; // JSONB
          requests: any; // JSONB
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          is_locked?: boolean;
          is_vip?: boolean;
          cart?: any;
          requests?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          table_id?: string;
          is_locked?: boolean;
          is_vip?: boolean;
          cart?: any;
          requests?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
