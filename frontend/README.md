# Frontend

This folder contains the Next.js (TypeScript) frontend for Raindropio-clone.

- Uses Supabase for authentication (Google SSO).
- Connects to backend API for team/user management.
- Environment variables in `.env.local` (see `phase1.md`).

See `PROJECT_PLAN.md` for architecture and `phase1.md` for environment setup.

## Local Development

1. Install dependencies:
	```bash
	npm install
	```
2. Copy `.env.example` to `.env.local` and fill in any missing values.
3. Run the app:
	```bash
	npm run dev
	```

## Environment Variables
See `.env.example` and `phase1.md` for required keys and URLs.

## Features
- Google SSO via Supabase
- Connects to backend API for team/user management

See `PROJECT_PLAN.md` for architecture and `phase1.md` for environment setup.
