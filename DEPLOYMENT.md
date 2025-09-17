# Deployment Environment Variables

This document outlines the environment variables that must be configured for production deployment.

## Frontend Environment Variables

Set these in your frontend deployment platform (Vercel, Netlify, etc.):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API URL (replace with your production backend URL)
NEXT_PUBLIC_API_URL=https://your-backend-domain.com

# Frontend URL (for CORS and callbacks)
FRONTEND_URL=https://your-frontend-domain.com
```

## Backend Environment Variables

Set these in your backend deployment platform (Railway, Render, etc.):

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Frontend URL for CORS configuration
FRONTEND_URL=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

## Development vs Production

### Local Development
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:8000`
- Environment variables use localhost URLs as fallbacks

### Production
- Both NEXT_PUBLIC_API_URL and FRONTEND_URL must be set to production URLs
- Remove localhost references from all deployment environment variables
- Ensure CORS is properly configured with production frontend URL

## Important Notes

1. **Never use `localhost` URLs in production environment variables**
2. **NEXT_PUBLIC_** prefix is required for frontend environment variables in Next.js
3. **FRONTEND_URL** is used by the backend for CORS configuration
4. **NEXT_PUBLIC_API_URL** is used by the frontend to communicate with the backend
5. **SUPABASE_SERVICE_KEY** in backend should be the service role key, not the anon key

## Verification

After deployment, verify:
- [ ] Frontend can communicate with backend API
- [ ] CORS errors are resolved
- [ ] No console errors about missing environment variables
- [ ] Authentication flow works properly