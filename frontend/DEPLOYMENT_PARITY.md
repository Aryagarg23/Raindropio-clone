# Local Dev vs Vercel Production Parity Guide

This guide helps ensure your local development environment matches your Vercel production deployment.

## Common Differences & Solutions

### 1. Environment Variables

**Issue**: Different API URLs, Supabase configs between local and production

**Solution**: Ensure consistent environment variables

#### Local (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

#### Vercel (Environment Variables)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

### 2. Build vs Dev Mode Differences

**Issue**: Next.js dev mode vs production build behave differently

**Solution**: Test production build locally

```bash
# Test production build locally
npm run build
npm run start
```

### 3. CSS/Styling Issues

**Issue**: Tailwind CSS purging removes styles in production

**Solution**: Ensure all classes are properly detected

#### Update tailwind.config.ts
```typescript
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './utils/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ... rest of config
}
```

### 4. Font Loading Issues

**Issue**: Fonts load differently in production

**Current Setup**: ✅ Using @fontsource (self-hosted fonts)
- This is optimal for consistent loading across environments

### 5. API Base URL Resolution

**Issue**: API calls use different URLs in different environments

**Current Solution**: ✅ Using `getApiBaseUrl()` utility
- Properly resolves based on environment variables

## Recommended Next.js Configuration

Create/update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Ensure consistent behavior
  experimental: {
    // Add any experimental features you're using
  },
  
  // Environment variable validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for consistent behavior
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
```

## Testing Checklist

### Before Deploying
- [ ] Run `npm run build` locally (check for build errors)
- [ ] Run `npm run start` locally (test production build)
- [ ] Check all environment variables are set in Vercel
- [ ] Verify API endpoints work in both environments
- [ ] Test authentication flows
- [ ] Check font loading
- [ ] Verify Tailwind styles aren't purged

### Debugging Production Issues

1. **Check Vercel Function Logs**
   ```bash
   vercel logs your-deployment-url
   ```

2. **Compare Network Requests**
   - Open Dev Tools → Network tab
   - Compare API calls between local and production
   - Check for CORS issues

3. **CSS Issues**
   - Check if custom CSS variables are defined
   - Verify Tailwind classes aren't being purged
   - Look for missing font files

4. **JavaScript Errors**
   - Check browser console for errors
   - Look for hydration mismatches
   - Check for missing environment variables

## Environment-Specific Code

Use this pattern for environment-specific behavior:

```typescript
// Utils for environment detection
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

// Example usage
const apiUrl = isDevelopment 
  ? 'http://localhost:8000' 
  : process.env.NEXT_PUBLIC_API_URL
```

## Vercel Deployment Settings

Ensure these settings in Vercel:

1. **Build Command**: `npm run build`
2. **Output Directory**: `.next`
3. **Install Command**: `npm install`
4. **Node.js Version**: 18.x (or your preferred version)

## Common Production-Only Issues

1. **Hydration Mismatches**: Use `useEffect` for client-only code
2. **Window/Document Undefined**: Check `typeof window !== 'undefined'`
3. **Environment Variables**: Prefix with `NEXT_PUBLIC_` for client-side access
4. **Font Loading**: Self-hosted fonts (✅ you're already doing this)
5. **CSS Variables**: Ensure they're defined in production build

## Quick Fix Commands

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Test production build
npm run build && npm run start

# Check bundle size
npm run build -- --analyze
```