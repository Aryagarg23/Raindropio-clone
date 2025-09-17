# Raindropio-clone

## Project Overview

Raindropio-clone is a collaborative bookmarking and knowledge organization platform. Phase 1 focuses on Google SSO authentication, team membership, and admin operations using Supabase, FastAPI, and Next.js.

**Current Status**: Actively refactoring large monolithic components into smaller, maintainable modules. Major progress made in breaking down the 3,487-line team site page into focused components.

## Goals
- Google SSO authentication via Supabase
- Team management and membership
- Admin panel for user/team management
- Secure backend with RLS and service role
- Cloud-only setup (Supabase/Postgres, buckets)
- **Maintainable codebase** with modular architecture and proper separation of concerns

## Project Structure
```
hi
```
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
- **✅ Completed**: Major refactoring of team site page - extracted CollectionTree, BookmarkGrid, and TeamSiteHeader components
- **✅ Completed**: Refactored BookmarkDetailModal.tsx from 836 lines to 184 lines by extracting BookmarkModalHeader, BookmarkContentViewer, BookmarkTagManager, BookmarkAnnotationsSidebar, and BookmarkHighlightTooltip components
- **✅ Completed**: Refactored dashboard.tsx from 631 lines to ~200 lines by extracting DashboardLoadingState, DashboardHeader, DashboardWelcomeMessage, TeamCard, and DashboardTeamsSection components
- **✅ Completed**: Refactored TeamSiteMainContent.tsx from 878 lines to 195 lines (**78% reduction**) by extracting MainTabContent, BookmarksTabContent, CollectionsTabContent, and ActivityTabContent components
- **🔄 In Progress**: Refactoring remaining large files ([teamId].tsx - 3111 LOC)
- **📋 Planned**: Break down useTeamSite hook, implement proper state management, add comprehensive testing

---
For questions, see the individual folder READMEs or contact the maintainer.