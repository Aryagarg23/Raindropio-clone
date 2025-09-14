# Raindropio-clone

## Project Overview

Raindropio-clone is a collaborative bookmarking and knowledge organization platform. Phase 1 focuses on Google SSO authentication, team membership, and admin operations using Supabase, FastAPI, and Next.js.

## Goals
- Google SSO authentication via Supabase
- Team management and membership
- Admin panel for user/team management
- Secure backend with RLS and service role
- Cloud-only setup (Supabase/Postgres, buckets)

## Project Structure

```
Raindropio-clone/
├── backend/      # FastAPI backend (Python, Uvicorn)
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── database/     # Supabase setup, migrations, storage
│   ├── README.md
│   └── .env.example
├── frontend/     # Next.js frontend (TypeScript)
│   ├── pages/
│   │   └── index.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── PROJECT_PLAN.md   # Detailed architecture and milestones
├── phase1.md         # Environment keys, URLs, setup checklist
├── .gitignore        # Root gitignore
└── README.md         # This file
```

## Setup & Development
- See `phase1.md` for environment keys and setup checklist
- See `PROJECT_PLAN.md` for architecture and milestones
- Each folder has its own README and .env.example

## Next Steps
- Scaffolded for local development using cloud Supabase and APIs
- Google SSO is the first milestone; no local buckets or Postgres

---
For questions, see the individual folder READMEs or contact the maintainer.