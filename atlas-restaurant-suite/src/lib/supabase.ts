import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wicufyfrkaigjhirdgeu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpY3VmeWZya2FpZ2poaXJkZ2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODMzMjcsImV4cCI6MjA4NTQ1OTMyN30.lqKJho15EnaohIhEtAq2TeISYhHHQvX-LdV9d9SETAc';

if (!supabaseAnonKey) {
  console.warn('VITE_SUPABASE_ANON_KEY is not set. Supabase features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
