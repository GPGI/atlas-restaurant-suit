# Vercel Environment Variables Setup

This app requires Supabase environment variables to be set in Vercel for the database to work properly.

## ⚠️ IMPORTANT: Database Setup Required First

**Before setting environment variables, you must create the database tables in your Supabase project.**

### Step 1: Create Database Tables

1. Go to your Supabase Dashboard: https://wicufyfrkaigjhirdgeu.supabase.co
2. Navigate to **SQL Editor** → **New Query**
3. Copy and paste the contents of `supabase_setup.sql` file
4. Click **Run** to execute the SQL
5. Wait 2-5 minutes for PostgREST to refresh its schema cache

This will create all required tables and set up the necessary permissions.

## Required Environment Variables

Add these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### For Production:
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://wicufyfrkaigjhirdgeu.supabase.co`

- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpY3VmeWZya2FpZ2poaXJkZ2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODMzMjcsImV4cCI6MjA4NTQ1OTMyN30.lqKJho15EnaohIhEtAq2TeISYhHHQvX-LdV9d9SETAc`

### For Preview/Development:
Use the same values as above.

## After Adding Variables

1. **Redeploy** your application in Vercel
2. The app will automatically use these environment variables
3. Check the browser console for Supabase connection logs

## Troubleshooting

### 404 Errors / PGRST205 Schema Cache Errors

If you see errors like `"Could not find the table 'public.menu_items' in the schema cache"`:

1. **Wait 2-5 minutes** - PostgREST automatically refreshes its schema cache, but there can be a delay after creating tables
2. **Check Supabase Dashboard** - Go to your Supabase project → Settings → API → and verify tables are listed
3. **Verify Environment Variables** - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly in Vercel
4. **Check Project URL** - Make sure you're using the correct Supabase project URL (should match where tables were created)
5. **Manual Refresh** - In Supabase Dashboard, go to Database → and try making a small change to trigger schema reload

### Other Common Issues

- **404 errors**: Verify environment variables are set correctly
- **RLS errors**: Check that Row Level Security policies allow public access
- **Connection errors**: Verify the Supabase project is active and not paused
- **Check browser console** for detailed error messages
