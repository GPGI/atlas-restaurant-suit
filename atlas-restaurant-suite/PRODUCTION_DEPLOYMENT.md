# Production Deployment Guide for Vercel

This guide covers deploying the ATLAS HOUSE restaurant management system to Vercel in production.

## Prerequisites

- Vercel account
- Supabase project with database set up
- Git repository connected to Vercel

## Environment Variables

Set the following environment variables in your Vercel project settings:

### Required Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for **Production**, **Preview**, and **Development** environments
4. Redeploy after adding variables

## Deployment Steps

### 1. Connect Repository

1. Import your Git repository to Vercel
2. Vercel will auto-detect the framework (Vite)

### 2. Configure Build Settings

Vercel should auto-detect these settings from `vercel.json`:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Deploy

1. Push to your main branch
2. Vercel will automatically deploy
3. Check deployment logs for any errors

## Production Optimizations

### Build Optimizations

- ✅ **Terser minification** - Removes console.logs and minifies code
- ✅ **Code splitting** - Admin pages lazy-loaded
- ✅ **Asset optimization** - Proper caching headers
- ✅ **Source maps disabled** - Smaller bundle size

### Security Headers

The following security headers are configured in `vercel.json`:

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features

### Caching Strategy

- **Static assets** (`/assets/*`): 1 year cache with immutable flag
- **HTML** (`/index.html`): No cache (always fresh)
- **Service Worker** (`/sw.js`): No cache (always fresh)

### Service Worker

- Network-first strategy for assets
- Offline fallback for HTML pages
- Automatic cache cleanup on updates

## Monitoring

### Error Tracking

The app includes an ErrorBoundary component that catches React errors. Consider integrating:

- **Sentry** - Error tracking and monitoring
- **LogRocket** - Session replay and error tracking
- **Vercel Analytics** - Performance monitoring

### Performance

Monitor these metrics:

- **First Contentful Paint (FCP)**
- **Largest Contentful Paint (LCP)**
- **Time to Interactive (TTI)**
- **Cumulative Layout Shift (CLS)**

## Troubleshooting

### Build Failures

1. Check build logs in Vercel dashboard
2. Verify environment variables are set correctly
3. Ensure `package.json` has all dependencies
4. Check for TypeScript errors: `npm run type-check`

### Runtime Errors

1. Check browser console for errors
2. Verify Supabase connection
3. Check network tab for failed requests
4. Review ErrorBoundary error messages

### Service Worker Issues

1. Clear browser cache and service worker
2. Check `sw.js` is being served correctly
3. Verify service worker registration in `main.tsx`

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test admin dashboard functionality
- [ ] Verify Supabase connection
- [ ] Test QR code scanning
- [ ] Check mobile responsiveness
- [ ] Verify offline functionality
- [ ] Test error boundaries
- [ ] Check security headers
- [ ] Verify caching works correctly
- [ ] Test real-time updates

## Rollback

If you need to rollback:

1. Go to Vercel dashboard
2. Navigate to **Deployments**
3. Find the previous working deployment
4. Click **⋯** → **Promote to Production**

## Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Check Supabase documentation: https://supabase.com/docs
- Review application logs in Vercel dashboard
