-- Create tables table for storing restaurant table sessions
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id TEXT UNIQUE NOT NULL,
  is_locked BOOLEAN DEFAULT false,
  is_vip BOOLEAN DEFAULT false,
  cart JSONB DEFAULT '[]'::jsonb,
  requests JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on table_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tables_table_id ON public.tables(table_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_tables_updated_at ON public.tables(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
-- For production, you should create more restrictive policies
CREATE POLICY "Allow all operations on tables" ON public.tables
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON public.tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default tables (Table_01 to Table_10)
INSERT INTO public.tables (table_id, is_locked, is_vip, cart, requests)
VALUES
  ('Table_01', false, false, '[]'::jsonb, '[]'::jsonb),
  ('Table_02', false, false, '[]'::jsonb, '[]'::jsonb),
  ('Table_03', false, false, '[]'::jsonb, '[]'::jsonb),
  ('Table_04', false, false, '[]'::jsonb, '[]'::jsonb),
  ('Table_05', false, false, '[]'::jsonb, '[]'::jsonb),
  ('Table_06', false, false, '[]'::jsonb, '[]'::jsonb),
  ('Table_07', false, false, '[]'::jsonb, '[]'::jsonb),
  ('Table_08', false, false, '[]'::jsonb, '[]'::jsonb),
  ('Table_09', false, false, '[]'::jsonb, '[]'::jsonb),
  ('Table_10', false, false, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (table_id) DO NOTHING;
