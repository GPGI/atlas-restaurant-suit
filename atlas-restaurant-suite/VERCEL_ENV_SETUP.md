# Vercel Environment Variables Setup

This app requires Supabase environment variables to be set in Vercel for the database to work properly.

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

If you see 404 errors:
- Verify the environment variables are set correctly
- Check that the Supabase project is active
- Ensure the tables exist in your Supabase database
- Check browser console for detailed error messages
