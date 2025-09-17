
# Frontend

This folder contains the Next.js (TypeScript) frontend for Raindropio-clone.

## Project Structure

### Pages (`pages/`)
- `_app.tsx`: App wrapper with global fonts, analytics, and styles
- `index.tsx`: Landing page with Google OAuth authentication
- `dashboard.tsx`: Main dashboard showing user profile and team list
- `admin.tsx`: Admin panel for managing teams and users
- `test.tsx`: Simple test page for development
- `team-site/[teamId].tsx`: Team site page with bookmarks, collections, and annotations (**2384 lines - COMPLETED**)
  - Successfully extracted DirectoryModal, TeamSiteMainContent, CollectionTree, BookmarkGrid, and TeamSiteHeader components
  - Reduced from 3111 lines to 2384 lines (23% reduction)
  - See `pages/team-site/README.md` for detailed analysis

### Components (`components/`)
#### Core Components
- `ProfileForm.tsx`: User profile completion form
- `ProfileIcon.tsx`: User avatar display component

#### Admin Components (`admin/`)
- `AdminPanelLayout.tsx`: Layout wrapper for admin pages
- `AdminTeamCard.tsx`: Team card for admin team management
- `AdminTeamForm.tsx`: Form for creating/editing teams
- `AdminUserCard.tsx`: User card for admin user management
- `ErrorMessage.tsx`: Error display component
- `LoadingSpinner.tsx`: Loading indicator
- `MemberManagementSection.tsx`: User membership management interface
- `MembersList.tsx`: List of team members
- `Modal.tsx`: Reusable modal dialog
- `TabNavigation.tsx`: Tab navigation component
- `TeamManagementSection.tsx`: Team management interface
- `TeamMemberManager.tsx`: Team member assignment tool
- `TeamsList.tsx`: List of teams for admin
- `UserTeamsDisplay.tsx`: Display user's team memberships

#### UI Components (`ui/`)
- `button.tsx`: Reusable button component (shadcn/ui)
- `card.tsx`: Card container component (shadcn/ui)
- `input.tsx`: Input field component (shadcn/ui)
- `tabs.tsx`: Tab navigation component (shadcn/ui)

#### Team-Site Components (`team-site/`)
##### Shared Components (`shared/`)
- `CollectionTree.tsx`: Hierarchical collection display with drag-and-drop functionality
- `FaviconImage.tsx`: Reusable favicon display with fallback logic
- `TeamSiteHeader.tsx`: Page header with navigation tabs and user presence

##### Collection Components (`collections/`)
- `CreateCollectionModal.tsx`: Modal for creating new collections with form validation

##### Bookmark Components (`bookmarks/`)
- `AddBookmarkModal.tsx`: Modal for adding bookmarks with URL validation and tag management
- `BookmarkDetailModal.tsx`: Complex modal for viewing bookmark details, highlights, and annotations
- `BookmarkGrid.tsx`: Grid/list view component for displaying bookmarks with editing capabilities

### Hooks (`hooks/`)
- `useAdminPanel.ts`: Admin panel state and API calls
- `useMemberManagement.ts`: User membership management logic
- `useTeamManagement.ts`: Team CRUD operations
- `useTeamSite.ts`: Team site state and bookmark/collection management (1106 lines - **REFACTOR NEEDED**)
  - See `hooks/useTeamSite.README.md` for detailed analysis

### Modules (`modules/`)
- `apiClient.ts`: Centralized API client for backend communication
- `supabaseClient.ts`: Supabase client configuration

### Types (`types/`)
- `api.ts`: TypeScript interfaces for API responses (288 lines)

### Utils (`utils/`)
- `colors.ts`: Color palette utilities and theme helpers

### Configuration Files
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `tailwind.config.ts`: Tailwind CSS configuration with custom colors
- `postcss.config.js`: PostCSS configuration
- `next.config.js`: Next.js configuration (empty)

## Features

- **Authentication**: Google SSO via Supabase
- **User Management**: Profile completion with avatar, name, and color selection
- **Team Management**: Create teams, manage members, team sites
- **Bookmark Management**: Save, organize, and annotate web bookmarks
- **Collections**: Hierarchical organization of bookmarks
- **Admin Panel**: Comprehensive admin interface for user and team management
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI**: Radix UI components with custom theming

## Architecture Notes

### Current Issues
1. **Large Files**: `BookmarkDetailModal.tsx` (835 lines) and `dashboard.tsx` (631 lines) still need refactoring
2. **Hook Complexity**: `useTeamSite.ts` (1106 lines) contains mixed concerns and could be broken down
3. **State Management**: Business logic and UI state are being properly separated

### Refactoring Progress ✅
- ✅ **Major Component Extraction**: Successfully extracted 3 major components from `[teamId].tsx`:
  - `CollectionTree.tsx` (263 LOC) - Hierarchical collection display with drag/drop
  - `BookmarkGrid.tsx` (254 LOC) - Bookmark display in grid/list views
  - `TeamSiteHeader.tsx` (182 LOC) - Header, tabs, and navigation
- ✅ **File Size Reduction**: Main page reduced from 3,487 to 3,111 LOC (11% reduction)
- ✅ **Code Cleanup**: Removed duplicate code and improved component composition
- ✅ **Build Verification**: All builds pass successfully, functionality preserved
- 🔄 **In Progress**: Refactoring remaining large files (`BookmarkDetailModal.tsx`, `dashboard.tsx`)
- 📋 **Next Steps**: Break down `useTeamSite` hook, create service layer, implement proper state management

### Refactoring Goals
- Break down large files into smaller, focused components
- Extract reusable logic into custom hooks
- Separate concerns (UI, business logic, data)
- Improve maintainability and testability

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in missing values
3. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables
See `.env.example` and `phase1.md` for required keys and URLs.

## Authentication Flow

1. User visits `/` and authenticates with Google
2. Redirected to `/dashboard` after successful auth
3. If profile incomplete, `ProfileForm` component is shown
4. User completes profile (name, avatar, favorite color)
5. Dashboard displays teams and allows navigation to team sites

## Admin Panel

Accessible at `/admin` for users with admin role. Features:
- Team creation and management
- User role assignment
- Member management across teams
- Team site administration

## Team Sites

Dynamic routes at `/team-site/[teamId]` providing:
- Bookmark collection and organization
- Hierarchical collections
- Annotation and highlighting system
- Search and filtering capabilities
- Drag-and-drop organization

## Proposed Refactored Structure

Based on the current analysis, here's the proposed modular architecture:

### Components Architecture
```
components/
├── core/                    # Core reusable components
│   ├── ProfileForm.tsx
│   ├── ProfileIcon.tsx
│   └── ...
├── admin/                   # Admin-specific components (keep as-is)
├── team-site/               # Team site components (extracted)
│   ├── bookmarks/
│   │   ├── BookmarkCard.tsx
│   │   ├── BookmarkGrid.tsx
│   │   ├── BookmarkList.tsx
│   │   └── BookmarkModal.tsx
│   ├── collections/
│   │   ├── CollectionTree.tsx
│   │   ├── CollectionCard.tsx
│   │   └── CollectionModal.tsx
│   ├── annotations/
│   │   ├── HighlightTooltip.tsx
│   │   ├── AnnotationList.tsx
│   │   └── HighlightColorPicker.tsx
│   ├── shared/
│   │   ├── FaviconImage.tsx
│   │   ├── DragHandle.tsx
│   │   └── LoadingState.tsx
│   └── layout/
│       ├── TeamSiteHeader.tsx
│       ├── Sidebar.tsx
│       └── MainContent.tsx
└── ui/                      # Design system components (keep as-is)
```

### Hooks Architecture
```
hooks/
├── auth/                    # Authentication hooks
│   └── useAuth.ts
├── admin/                   # Admin-specific hooks
│   ├── useAdminPanel.ts
│   ├── useTeamManagement.ts
│   └── useMemberManagement.ts
├── team-site/               # Team site hooks (broken down)
│   ├── useBookmarks.ts
│   ├── useCollections.ts
│   ├── useAnnotations.ts
│   ├── useDragDrop.ts
│   └── useTeamFilters.ts
└── shared/                  # Shared utility hooks
    └── useLocalStorage.ts
```

### Services Architecture
```
services/
├── api/                     # API service functions
│   ├── bookmarkService.ts
│   ├── collectionService.ts
│   ├── teamService.ts
│   └── userService.ts
├── supabase/                # Supabase-specific services
│   ├── authService.ts
│   └── realtimeService.ts
└── utils/                   # Utility services
    ├── validationService.ts
    └── formattingService.ts
```

### State Management
```
stores/
├── authStore.ts             # Authentication state
├── teamStore.ts             # Team-related state
├── bookmarkStore.ts         # Bookmark state
└── uiStore.ts               # UI state (modals, etc.)
```

### Pages Architecture (Post-Refactor)
```
pages/
├── _app.tsx                 # App wrapper
├── index.tsx                # Landing page
├── dashboard.tsx            # Dashboard (simplified)
├── admin.tsx                # Admin panel
├── team-site/
│   ├── [teamId].tsx         # Main team page (dramatically simplified)
│   └── components/          # Page-specific components
└── _error.tsx               # Error page
```

### Benefits of This Structure
1. **Separation of Concerns**: Each directory has a clear responsibility
2. **Reusability**: Components and hooks can be reused across features
3. **Testability**: Smaller units are easier to test
4. **Maintainability**: Changes are localized to specific areas
5. **Scalability**: Easy to add new features without affecting existing code
6. **Developer Experience**: Clearer navigation and understanding of codebase

### Migration Strategy
1. **Phase 1**: Extract inline components from `[teamId].tsx`
2. **Phase 2**: Break down `useTeamSite` hook into smaller hooks
3. **Phase 3**: Create service layer for API operations
4. **Phase 4**: Implement proper state management
5. **Phase 5**: Add comprehensive tests and documentation

## Component Library & Reusability

See `COMPONENT_LIBRARY.md` for:
- **Complete component catalog** with usage examples
- **Design system patterns** and styling conventions
- **Reusability guidelines** - when to reuse vs create new components
- **Composition patterns** for building complex UIs
- **Quick reference** for common props and styling

**Always consult this document before creating new components or elements.**
