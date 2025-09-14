
# Frontend

This folder contains the Next.js (TypeScript) frontend for Raindropio-clone.

## Structure

- `pages/`: Main Next.js pages (`index.tsx`, `_app.tsx`, `onboarding.tsx`)
- `modules/`: App-wide modules (e.g., `supabaseClient.ts` for Supabase integration)
- `components/`: Reusable React components (e.g., `ProfileForm.tsx` for profile completion)
- `utils/`: Utility functions (e.g., color palette helpers)
- `styles/`: Global CSS variables and theme definitions

## Features

- Google SSO via Supabase (only Google sign-in is allowed)
- Onboarding flow: Users must complete their profile (name, avatar, color) after sign-in
- Profile completion form is modular and reusable
- All colors, fonts, and layout follow the style guide in `STYLE_GUIDE.md`

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

## Onboarding Flow

1. User lands on `/` and is prompted to sign in with Google.
2. After sign-in, if profile is incomplete, the profile form appears (modular component).
3. User must provide name, avatar, and favorite color (snapped to palette).
4. On success, user is shown their profile and can proceed to the app.

## Module Overview

- `modules/supabaseClient.ts`: Centralized Supabase client
- `components/ProfileForm.tsx`: Profile completion form
- `utils/colors.ts`: Color palette and snapping helpers

## Style Guide

All UI follows the dark-first, modern style guide in `STYLE_GUIDE.md`. Fonts (Inter, Nunito Sans) are loaded globally.
