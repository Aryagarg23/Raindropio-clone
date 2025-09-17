
# Frontend

This folder contains the Next.js (TypeScript) frontend for Raindropio-clone.

## Project Structure

### Pages (`pages/`)
- `_app.tsx`: App wrapper with global fonts, analytics, and styles
- `index.tsx`: Landing page with Google OAuth authentication
- `dashboard.tsx`: Main dashboard showing user profile and team list
- `admin.tsx`: Admin panel for managing teams and users
- `test.tsx`: Simple test page for development
- `team-site/[teamId].tsx`: Team site page with bookmarks, collections, and annotations (5830 lines - **REFACTOR NEEDED**)

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

### Hooks (`hooks/`)
- `useAdminPanel.ts`: Admin panel state and API calls
- `useMemberManagement.ts`: User membership management logic
- `useTeamManagement.ts`: Team CRUD operations
- `useTeamSite.ts`: Team site state and bookmark/collection management (1106 lines - **REFACTOR NEEDED**)

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
1. **Massive Files**: `[teamId].tsx` (5830 lines) and `useTeamSite.ts` (1106 lines) are excessively large and need refactoring
2. **Inline Components**: Many components are defined inline in `[teamId].tsx` instead of being modular
3. **Mixed Concerns**: Business logic, UI, and data fetching are tightly coupled

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

## Style Guide

See `STYLE_GUIDE.md` for design system details. Uses:
- **Fonts**: Inter (sans-serif), Nunito Sans (headings)
- **Colors**: Custom grey accent palette with CSS variables
- **Components**: Radix UI primitives with Tailwind styling
- **Icons**: Lucide React icon library
