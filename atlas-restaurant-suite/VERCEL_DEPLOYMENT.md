# Vercel Deployment Guide

## Configuration

This is a **Vite + React** application, not Next.js.

### Vercel Settings

1. **Framework Preset**: Select "Other" or "Vite" (if available)
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`

### Environment Variables

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

- `VITE_SUPABASE_URL` = `https://wicufyfrkaigjhirdgeu.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpY3VmeWZya2FpZ2poaXJkZ2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODMzMjcsImV4cCI6MjA4NTQ1OTMyN30.lqKJho15EnaohIhEtAq2TeISYhHHQvX-LdV9d9SETAc`

### Troubleshooting

If the app is not loading:

1. **Check Build Logs**: Go to Vercel Dashboard → Deployments → Click on latest deployment → View build logs
2. **Check Runtime Logs**: Go to Vercel Dashboard → Deployments → Functions → Check for errors
3. **Verify Environment Variables**: Make sure all `VITE_*` variables are set
4. **Clear Cache**: In Vercel Dashboard → Settings → Clear Build Cache → Redeploy

### Common Issues

**Issue**: White screen / App not loading
- **Solution**: Check browser console for errors. Usually missing environment variables or build errors.

**Issue**: 404 on routes
- **Solution**: The `vercel.json` should have the rewrite rule (already configured).

**Issue**: React undefined errors
- **Solution**: This was fixed in the latest commit. Make sure you're on the latest version.

**Issue**: Supabase connection errors
- **Solution**: Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly.

### Manual Deployment Steps

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → General
4. Verify:
   - Framework Preset: "Other"
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Go to Settings → Environment Variables
6. Add/verify the two `VITE_*` variables
7. Go to Deployments
8. Click "Redeploy" on the latest deployment
