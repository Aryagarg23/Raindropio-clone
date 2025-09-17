# Component Library & Design System

## Overview
This document serves as the central reference for the Raindropio-clone frontend design system, component library, and reusable patterns. Use this guide when creating new components or elements to ensure consistency, reusability, and maintainability.

## 🎨 Design Principles

### Aesthetic Guidelines
- **Modern & Clean**: Minimalist design with subtle shadows and rounded corners
- **Dark-First**: Grey accent color palette with light mode support
- **Typography**: Inter for body text, Nunito Sans for headings
- **Spacing**: Consistent 4px grid system (4, 8, 12, 16, 20, 24, 32, 48, 64px)
- **Colors**: Limited palette focusing on grey accents with semantic colors

### Component Philosophy
- **Composition over Inheritance**: Build complex UIs from simple, reusable parts
- **Single Responsibility**: Each component should do one thing well
- **Consistent API**: Similar components should have similar prop interfaces
- **Accessibility First**: All components must be keyboard and screen reader accessible

---

## 🧩 Component Categories

### Core Components

#### ProfileIcon
```tsx
<ProfileIcon user={user} size="md" className="custom-class" />
```
**Purpose**: Display user avatars with fallback to initials
**Props**:
- `user`: UserProfile object
- `size`: "sm" | "md" | "lg" | "xl"
- `className`: Additional CSS classes
**Usage**: User representations throughout the app
**Styling**: Circular, gradient fallback background

#### ProfileForm
```tsx
<ProfileForm user={user} profile={profile} onProfileUpdated={callback} />
```
**Purpose**: Complete user profile setup
**Props**:
- `user`: Auth user object
- `profile`: Current profile data
- `onProfileUpdated`: Success callback
**Usage**: Profile completion flow
**Styling**: Card-based layout with form validation

### UI Components (shadcn/ui based)

#### Button
```tsx
<Button variant="default" size="md" onClick={handler}>
  Click me
</Button>
```
**Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
**Sizes**: `sm`, `md`, `lg`
**Usage**: All interactive elements
**Styling**: Consistent with design system colors

#### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```
**Purpose**: Content containers with consistent spacing
**Usage**: Dashboard cards, modals, sections
**Styling**: Subtle shadows, rounded corners

#### Input
```tsx
<Input
  type="text"
  placeholder="Enter text"
  value={value}
  onChange={handler}
/>
```
**Purpose**: Form inputs with consistent styling
**Usage**: All text input fields
**Styling**: Border focus states, error states

#### Tabs
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
</Tabs>
```
**Purpose**: Tabbed navigation
**Usage**: Admin panel, settings pages
**Styling**: Underline active state

### Admin Components

#### AdminPanelLayout
```tsx
<AdminPanelLayout>
  {/* Admin content */}
</AdminPanelLayout>
```
**Purpose**: Consistent admin page wrapper
**Features**: Header, responsive layout
**Usage**: All admin pages

#### AdminTeamCard
```tsx
<AdminTeamCard
  team={team}
  selected={isSelected}
  onSelect={handler}
  onModify={handler}
/>
```
**Purpose**: Team display in admin interface
**Props**: Team data, selection state, action handlers
**Styling**: Hover states, selection indicators

#### AdminUserCard
```tsx
<AdminUserCard
  user={user}
  selected={isSelected}
  onSelect={handler}
  disabled={false}
  compact={false}
/>
```
**Purpose**: User display in admin interface
**Props**: User data, selection state, compact mode
**Styling**: Avatar, name, role badges

#### Modal
```tsx
<Modal isOpen={showModal} onClose={closeHandler} title="Modal Title">
  {/* Modal content */}
</Modal>
```
**Purpose**: Overlay dialogs
**Features**: Backdrop, close button, keyboard handling
**Usage**: Forms, confirmations, details

#### LoadingSpinner
```tsx
<LoadingSpinner message="Loading..." />
```
**Purpose**: Loading states
**Props**: Optional message
**Styling**: Centered, animated spinner

#### ErrorMessage
```tsx
<ErrorMessage message="Error occurred" onDismiss={handler} />
```
**Purpose**: Error display with dismiss option
**Styling**: Red accent colors, close button

#### AdminTeamForm
```tsx
<AdminTeamForm
  onSubmit={handleCreateTeam}
  onCancel={handleCancel}
  initialData={editingTeam}
/>
```
**Purpose**: Form for creating or editing teams in admin panel
**Props**:
- `onSubmit`: Submit handler with team data
- `onCancel`: Cancel handler
- `initialData`: Optional existing team data for editing
**Features**: Form validation, team name and description fields

#### MemberManagementSection
```tsx
<MemberManagementSection
  teamId={selectedTeamId}
  members={teamMembers}
  onUpdateMembers={handleUpdateMembers}
/>
```
**Purpose**: User membership management interface for teams
**Props**:
- `teamId`: ID of the team being managed
- `members`: Array of current team members
- `onUpdateMembers`: Handler for membership updates
**Features**: Add/remove members, role management

#### MembersList
```tsx
<MembersList
  members={members}
  onRemoveMember={handleRemoveMember}
  onUpdateRole={handleUpdateRole}
/>
```
**Purpose**: Display list of team members with management actions
**Props**:
- `members`: Array of team members
- `onRemoveMember`: Handler for removing members
- `onUpdateRole`: Handler for updating member roles
**Features**: Member avatars, role badges, action buttons

#### TabNavigation
```tsx
<TabNavigation
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={handleTabChange}
/>
```
**Purpose**: Tab navigation component for admin sections
**Props**:
- `tabs`: Array of tab objects with id and label
- `activeTab`: Currently active tab ID
- `onTabChange`: Tab change handler
**Styling**: Horizontal tab layout with active state indicators

#### TeamManagementSection
```tsx
<TeamManagementSection
  teams={teams}
  onCreateTeam={handleCreateTeam}
  onEditTeam={handleEditTeam}
  onDeleteTeam={handleDeleteTeam}
/>
```
**Purpose**: Team management interface with CRUD operations
**Props**:
- `teams`: Array of teams to display
- `onCreateTeam`: Handler for creating new teams
- `onEditTeam`: Handler for editing teams
- `onDeleteTeam`: Handler for deleting teams
**Features**: Team list, create/edit/delete actions

#### TeamMemberManager
```tsx
<TeamMemberManager
  teamId={teamId}
  availableUsers={availableUsers}
  currentMembers={currentMembers}
  onAddMember={handleAddMember}
  onRemoveMember={handleRemoveMember}
/>
```
**Purpose**: Tool for managing team member assignments
**Props**:
- `teamId`: ID of the team
- `availableUsers`: Users available to add to team
- `currentMembers`: Current team members
- `onAddMember`: Handler for adding members
- `onRemoveMember`: Handler for removing members
**Features**: User selection interface, member role assignment

#### TeamsList
```tsx
<TeamsList
  teams={teams}
  onSelectTeam={handleSelectTeam}
  selectedTeamId={selectedTeamId}
/>
```
**Purpose**: Display list of teams for admin management
**Props**:
- `teams`: Array of teams to display
- `onSelectTeam`: Handler for team selection
- `selectedTeamId`: ID of currently selected team
**Features**: Team cards with selection states, member counts

#### UserTeamsDisplay
```tsx
<UserTeamsDisplay
  userId={userId}
  teams={userTeams}
  onLeaveTeam={handleLeaveTeam}
/>
```
**Purpose**: Display user's team memberships with management options
**Props**:
- `userId`: ID of the user
- `teams`: Array of teams the user belongs to
- `onLeaveTeam`: Handler for leaving teams
**Features**: Team membership overview, leave team actions

### Team Site Components (Extracted)

#### FaviconImage
```tsx
<FaviconImage url={bookmark.url} faviconUrl={bookmark.favicon_url} size="w-4 h-4" />
```
**Purpose**: Display website favicons with multiple fallback services
**Props**:
- `url`: Website URL (required)
- `faviconUrl`: Direct favicon URL (optional)
- `size`: Tailwind size classes (default: "w-4 h-4")
- `className`: Additional CSS classes
**Features**: Progressive fallback (Yandex → Google → DuckDuckGo → Direct → Default icon)
**Styling**: Object-fit contain, consistent sizing
**Usage**: Bookmark displays, link previews

#### CreateCollectionModal
```tsx
<CreateCollectionModal
  onClose={handleClose}
  onCreate={handleCreate}
  collections={collections}
/>
```
**Purpose**: Modal dialog for creating new collections
**Props**:
- `onClose`: Close handler function
- `onCreate`: Create handler with name, description, color, parentId
- `collections`: Array of existing collections for parent selection
**Features**: Form validation, color picker, parent collection selection, keyboard shortcuts (ESC)
**Styling**: Modal overlay, card layout, form inputs with proper spacing

#### CollectionTree
```tsx
<CollectionTree
  collections={nestedCollections}
  bookmarks={bookmarks}
  expandedCollections={expandedCollections}
  selectedCollectionId={selectedCollectionId}
  draggedCollection={draggedCollection}
  draggedBookmark={draggedBookmark}
  dragOverData={dragOverData}
  dragOverTarget={dragOverTarget}
  onToggleCollection={handleToggleCollection}
  onSelectCollection={handleSelectCollection}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  onBookmarkDragOver={handleBookmarkDragOver}
  onBookmarkDrop={handleBookmarkDrop}
/>
```
**Purpose**: Hierarchical collection tree with drag-and-drop functionality for organizing bookmarks and collections
**Props**:
- `collections`: Array of nested collection objects
- `bookmarks`: Array of bookmark objects
- `expandedCollections`: Set of expanded collection IDs
- `selectedCollectionId`: Currently selected collection ID
- `draggedCollection/draggedBookmark`: IDs of items being dragged
- `dragOverData/dragOverTarget`: Drag state information
- Event handlers for all drag/drop and interaction operations
**Features**: Recursive tree rendering, drag indicators, collection expansion, bookmark nesting, visual feedback for drag operations
**Styling**: Indented hierarchy, drag handles, hover states, visual drop zones

#### CollectionTreeRenderer
```tsx
<CollectionTreeRenderer
  collections={nestedCollections}
  level={0}
  bookmarks={bookmarks}
  expandedCollections={expandedCollections}
  selectedCollectionId={selectedCollectionId}
  dragOverData={dragOverData}
  draggedCollection={draggedCollection}
  draggedBookmark={draggedBookmark}
  dragOverTarget={dragOverTarget}
  onToggleCollection={handleToggleCollection}
  onSetSelectedCollectionId={setSelectedCollectionId}
  onHandleBookmarkClick={handleBookmarkClick}
  onHandleDragStart={handleDragStart}
  onHandleDragEnd={handleDragEnd}
  onHandleDragOver={handleDragOver}
  onHandleDragLeave={handleDragLeave}
  onHandleDrop={handleDrop}
  onHandleBookmarkDragStart={handleBookmarkDragStart}
  onHandleBookmarkDragOver={handleBookmarkDragOver}
  onHandleBookmarkDrop={handleBookmarkDrop}
/>
```
**Purpose**: Recursive component for rendering collection tree hierarchy with drag-and-drop support
**Props**:
- `collections`: Array of collection objects at current level
- `level`: Current nesting level (default: 0)
- `bookmarks`: Array of all bookmarks for counting and display
- `expandedCollections`: Set of expanded collection IDs
- `selectedCollectionId`: Currently selected collection ID
- `dragOverData/draggedCollection/draggedBookmark/dragOverTarget`: Drag state information
- Event handlers for collection/bookmark interactions and drag operations
**Features**: Recursive rendering, visual drag indicators, collection expansion, bookmark display within collections, proper event handling with stopPropagation
**Composition**: Extracted from renderCollectionTree function for better modularity and reusability
**Benefits**: Cleaner component code, recursive tree rendering, comprehensive drag-drop functionality

#### BookmarkGrid
```tsx
<BookmarkGrid
  bookmarks={filteredBookmarks}
  viewMode={viewMode}
  editingTags={editingTags}
  tagInput={tagInput}
  onBookmarkClick={handleBookmarkClick}
  onUpdateTags={handleUpdateTags}
  onSetEditingTags={setEditingTags}
  onSetTagInput={setTagInput}
/>
```
**Purpose**: Grid/list view component for displaying bookmarks with editing capabilities
**Props**:
- `bookmarks`: Array of bookmark objects to display
- `viewMode`: "grid" or "list" display mode
- `editingTags`: ID of bookmark currently being edited
- `tagInput`: Current tag input value
- Event handlers for bookmark interactions and tag editing
**Features**: Grid/list toggle, inline tag editing, bookmark details modal, creator information, creation dates, external link access
**Styling**: Card-based layout, responsive grid, hover effects, tag chips, profile icons

#### TeamSiteHeader
```tsx
<TeamSiteHeader
  presence={presence}
  bookmarksCount={bookmarks.length}
  collectionsCount={collections.length}
  activeTab={activeTab}
  searchQuery={searchQuery}
  viewMode={viewMode}
  onActiveTabChange={setActiveTab}
  onSearchQueryChange={setSearchQuery}
  onViewModeChange={setViewMode}
  onCreateAction={handleCreateAction}
/>
```
**Purpose**: Page header component with navigation, search, and user presence for team sites
**Props**:
- `presence`: Array of online team members
- `bookmarksCount/collectionsCount`: Statistics for display
- `activeTab`: Current active tab ("main", "bookmarks", "collections", "activity")
- `searchQuery/viewMode`: Search and display state
- Event handlers for navigation and actions
**Features**: Online member display, tab navigation, search input, view mode toggle, create action buttons, responsive design
**Styling**: Header layout, presence indicators, tab navigation, search input with icon

#### AddBookmarkModal
```tsx
<AddBookmarkModal
  collections={collections}
  onClose={handleClose}
  onCreate={handleCreate}
/>
```
**Purpose**: Modal dialog for adding new bookmarks with URL validation and tag management
**Props**:
- `collections`: Array of available collections for bookmark organization
- `onClose`: Close handler function
- `onCreate`: Create handler with URL, title, collection ID, and tags
**Features**: URL validation, automatic title fetching, tag input with suggestions, collection selection, keyboard shortcuts (ESC)
**Styling**: Modal overlay, form layout with validation states

#### BookmarkDetailModal
```tsx
<BookmarkDetailModal
  bookmark={selectedBookmark}
  user={user}
  teamId={normalizedTeamId}
  bookmarkTags={selectedBookmark.tags || []}
  tagInput={tagInput}
  showTagSuggestions={showTagSuggestions}
  availableTags={availableTags}
  commentInputs={commentInputs}
  onClose={() => setSelectedBookmark(null)}
  onViewModeChange={setBookmarkViewMode}
  onCreateHighlight={createHighlight}
  onCreateAnnotation={createAnnotation}
  onToggleAnnotationLike={toggleAnnotationLike}
  onDeleteAnnotation={deleteAnnotation}
  onExtractContent={extractContent}
  onFetchProxyContent={fetchProxyContent}
  onUpdateTags={updateSelectedBookmarkTags}
  onSetNewAnnotation={setNewAnnotation}
  onSetHighlightColor={setHighlightColor}
  onSetShowHighlightTooltip={setShowHighlightTooltip}
  onSetTooltipPosition={setTooltipPosition}
  onSetPendingSelection={setPendingSelection}
  onSetTagInput={setTagInput}
  onSetShowTagSuggestions={setShowTagSuggestions}
  onSetCommentInputs={() => {}}
/>
```
**Purpose**: Comprehensive modal for viewing bookmark details, highlights, annotations, and content
**Props**: Extensive props for bookmark data, user interactions, content extraction, and annotation management
**Features**: Multiple view modes (reader, proxy, details), text highlighting, annotation system, tag management, content extraction
**Styling**: Full-screen modal with tabbed interface, responsive design
```tsx
<BookmarkFilters
  showFilters={showFilters}
  setShowFilters={setShowFilters}
  bookmarkFilters={bookmarkFilters}
  setBookmarkFilters={setBookmarkFilters}
  advancedFilteredBookmarks={bookmarks}
  allTags={allTags}
  collections={collections}
  allCreators={allCreators}
/>
```
**Purpose**: Advanced filtering interface for bookmarks with search, tags, collections, creators, sorting, and date range
**Props**:
- `showFilters`: Boolean to toggle filter visibility
- `setShowFilters`: Function to toggle filter display
- `bookmarkFilters`: Current filter state object
- `setBookmarkFilters`: Function to update filter state
- `advancedFilteredBookmarks`: Filtered bookmark array
- `allTags`: Array of all available tags
- `collections`: Array of available collections
- `allCreators`: Array of all bookmark creators
**Features**: Collapsible filters, multi-select with chips, quick stats, clear all functionality, date range filtering
**Styling**: Card layout with grid-based filter controls, color-coded filter chips

#### DirectoryTreeView
```tsx
<DirectoryTreeView
  collection={collection}
  bookmarks={bookmarks}
  level={0}
/>
```
**Purpose**: Render hierarchical directory structure of collections and bookmarks
**Props**:
- `collection`: ExtendedCollection object with children
- `bookmarks`: Array of bookmarks to display
- `level`: Indentation level (default: 0)
**Features**: Recursive rendering, favicon display, tag visualization, nested collections
**Styling**: Monospace font, indented hierarchy, folder icons, link styling

#### DirectoryModal
```tsx
<DirectoryModal
  collection={selectedDirectoryCollection}
  bookmarks={bookmarks}
  showDirectoryModal={showDirectoryModal}
  onSetShowDirectoryModal={setShowDirectoryModal}
  onCopyDirectoryStructure={copyDirectoryStructure}
/>
```
**Purpose**: Modal dialog displaying hierarchical directory structure of collections and bookmarks with copy functionality
**Props**:
- `collection`: Selected collection to display directory for
- `bookmarks`: Array of all bookmarks for the directory
- `showDirectoryModal`: Boolean to control modal visibility
- `onSetShowDirectoryModal`: Function to toggle modal visibility
- `onCopyDirectoryStructure`: Function to copy directory structure to clipboard
**Features**: Markdown-formatted directory tree, clipboard copy with toast notification, recursive collection traversal, bookmark links with favicons
**Styling**: Full-screen modal with monospace font, hierarchical indentation, copy button with icon

#### TeamSiteMainContent
```tsx
<TeamSiteMainContent
  activeTab={activeTab}
  viewMode={viewMode}
  searchQuery={searchQuery}
  collections={collections}
  bookmarks={bookmarks}
  nestedCollections={nestedCollections}
  expandedCollections={expandedCollections}
  selectedCollectionId={selectedCollectionId}
  advancedFilteredBookmarks={advancedFilteredBookmarks}
  bookmarkFilters={bookmarkFilters}
  showFilters={showFilters}
  filteredCollections={filteredCollections}
  collectionFilters={collectionFilters}
  showCollectionFilters={showCollectionFilters}
  allTags={allTags}
  allCreators={allCreators}
  allCollectionCreators={allCollectionCreators}
  parentCollections={parentCollections}
  allFlatCollections={allFlatCollections}
  teamEvents={teamEvents}
  selectedDirectoryCollection={selectedDirectoryCollection}
  showDirectoryModal={showDirectoryModal}
  onActiveTabChange={setActiveTab}
  onSearchQueryChange={setSearchQuery}
  onViewModeChange={setViewMode}
  onToggleCollection={toggleCollection}
  onSelectCollection={setSelectedCollectionId}
  onBookmarkClick={handleBookmarkClick}
  onSetBookmarkFilters={setBookmarkFilters}
  onSetShowFilters={setShowFilters}
  onSetCollectionFilters={setCollectionFilters}
  onSetShowCollectionFilters={setShowCollectionFilters}
  onSetSelectedDirectoryCollection={setSelectedDirectoryCollection}
  onSetShowDirectoryModal={setShowDirectoryModal}
  onCopyDirectoryStructure={copyDirectoryStructure}
  renderCollectionTree={renderCollectionTree}
/>
```
**Purpose**: Main content component orchestrating the tabbed interface for team sites with bookmarks, collections, and activity views
**Props**: Extensive props for all tab states, filtering, collections, bookmarks, and event handlers
**Features**: Tabbed navigation (Bookmarks, Collections, Activity), advanced filtering systems, drag-and-drop collection management, real-time activity feed, directory structure modal, responsive grid layouts
**Styling**: Tabbed interface with consistent spacing, card-based layouts, responsive design, loading states

#### MainTabContent
```tsx
<MainTabContent
  viewMode={viewMode}
  collections={nestedCollections}
  selectedCollectionId={selectedCollectionId}
  advancedFilteredBookmarks={advancedFilteredBookmarks}
  bookmarkFilters={bookmarkFilters}
  onViewModeChange={setViewMode}
  onBookmarkClick={handleBookmarkClick}
  onSetBookmarkFilters={setBookmarkFilters}
  renderCollectionTree={renderCollectionTree}
/>
```
**Purpose**: Main tab content displaying collection tree sidebar and bookmarks grid with filtering
**Props**:
- `viewMode`: "grid" | "list" display mode
- `collections`: Array of nested collection objects
- `selectedCollectionId`: Currently selected collection ID
- `advancedFilteredBookmarks`: Filtered bookmark array
- `bookmarkFilters`: Current bookmark filter state
- Event handlers for view mode, bookmark interactions, and filtering
**Features**: Collection tree navigation, bookmark grid/list view, advanced filtering, collection selection
**Styling**: Two-column layout (sidebar + content), responsive grid, card-based bookmark display

#### BookmarksTabContent
```tsx
<BookmarksTabContent
  viewMode={viewMode}
  advancedFilteredBookmarks={advancedFilteredBookmarks}
  bookmarkFilters={bookmarkFilters}
  showFilters={showFilters}
  allTags={allTags}
  collections={collections}
  allCreators={allCreators}
  onBookmarkClick={handleBookmarkClick}
  onSetBookmarkFilters={setBookmarkFilters}
  onSetShowFilters={setShowFilters}
/>
```
**Purpose**: Dedicated bookmarks tab with advanced filtering and grid display
**Props**:
- `viewMode`: "grid" | "list" display mode
- `advancedFilteredBookmarks`: Filtered bookmark array
- `bookmarkFilters`: Current filter state object
- `showFilters`: Boolean to toggle filter visibility
- `allTags/collections/allCreators`: Arrays for filter options
- Event handlers for bookmark interactions and filtering
**Features**: BookmarkFilters integration, grid/list toggle, advanced search and filtering, tag-based filtering, creator filtering
**Styling**: Filter header with collapsible controls, responsive bookmark grid, consistent with main tab

#### CollectionsTabContent
```tsx
<CollectionsTabContent
  filteredCollections={filteredCollections}
  collectionFilters={collectionFilters}
  showCollectionFilters={showCollectionFilters}
  allCollectionCreators={allCollectionCreators}
  parentCollections={parentCollections}
  allFlatCollections={allFlatCollections}
  bookmarks={bookmarks}
  onSetShowCollectionFilters={setShowCollectionFilters}
  onSetCollectionFilters={setCollectionFilters}
  onSetSelectedDirectoryCollection={setSelectedDirectoryCollection}
  onSetShowDirectoryModal={setShowDirectoryModal}
  onCopyDirectoryStructure={copyDirectoryStructure}
/>
```
**Purpose**: Collections tab with advanced filtering and collection management
**Props**:
- `filteredCollections`: Array of filtered collection objects
- `collectionFilters`: Current collection filter state
- `showCollectionFilters`: Boolean to toggle filter visibility
- `allCollectionCreators/parentCollections/allFlatCollections`: Arrays for filter options
- `bookmarks`: Array of all bookmarks for count display
- Event handlers for filtering, modal control, and directory operations
**Features**: Collection filtering by creator/parent/status, sorting options, directory structure modal, collection statistics, nested collection display
**Styling**: Filter controls with quick stats, responsive collection grid, card-based collection display

#### ActivityTabContent
```tsx
<ActivityTabContent teamEvents={teamEvents} />
```
**Purpose**: Team activity feed displaying recent actions and events
**Props**:
- `teamEvents`: Array of team event objects with user, action, timestamp data
**Features**: Event timeline with user avatars, relative timestamps, event type badges, hover details, empty state
**Styling**: Card-based layout, event list with icons, timestamp formatting, hover effects

---

## 📊 Dashboard Components (Extracted)

#### DashboardLoadingState
```tsx
<DashboardLoadingState
  retryCount={retryCount}
  error={error}
  onRetry={retryLoading}
/>
```
**Purpose**: Loading screen with retry functionality for dashboard initialization
**Props**:
- `retryCount`: Number of retry attempts made
- `error`: Error message string (optional)
- `onRetry`: Function to handle retry action
**Features**: Animated spinner, retry counter display, error message with retry button, page refresh fallback
**Styling**: Full-screen centered layout, gradient background, card-based error display

#### DashboardHeader
```tsx
<DashboardHeader
  profile={profile}
  onSignOut={signOut}
/>
```
**Purpose**: Header component displaying user profile information and sign out functionality
**Props**:
- `profile`: UserProfile object with avatar, name, role, favorite color
- `onSignOut`: Function to handle user sign out
**Features**: User avatar with fallback, role badge, favorite color display, admin panel link, sign out button
**Styling**: Top-right positioned, compact layout, profile icon with status indicator

#### DashboardWelcomeMessage
```tsx
<DashboardWelcomeMessage
  profile={profile}
  profileLoading={profileLoading}
/>
```
**Purpose**: Welcome message for new users during profile setup
**Props**:
- `profile`: UserProfile object (may be null during setup)
- `profileLoading`: Boolean indicating if profile is being loaded
**Features**: Personalized greeting, setup progress indicator, loading state display
**Styling**: Gradient background card, emoji icon, responsive text layout

#### TeamCard
```tsx
<TeamCard
  team={team}
  members={teamMembers[team.id] || []}
  membersLoading={membersLoading[team.id]}
/>
```
**Purpose**: Individual team display card with member avatars and team information
**Props**:
- `team`: Team object with id, name, description, logo_url, created_at
- `members`: Array of team member objects
- `membersLoading`: Boolean indicating if member data is loading
**Features**: Team logo with fallback, member avatar stack with tooltips, member count display, creation date, description, navigation link
**Styling**: Card layout with hover effects, responsive member display, gradient fallbacks

#### DashboardTeamsSection
```tsx
<DashboardTeamsSection
  teams={teams}
  teamMembers={teamMembers}
  teamsLoading={teamsLoading}
  membersLoading={membersLoading}
  onRefreshTeams={fetchTeams}
/>
```
**Purpose**: Complete teams section with loading states, empty state, and team grid
**Props**:
- `teams`: Array of team objects
- `teamMembers`: Object mapping team IDs to member arrays
- `teamsLoading`: Boolean indicating if teams are loading
- `membersLoading`: Object mapping team IDs to loading states
- `onRefreshTeams`: Function to refresh team data
**Features**: Loading skeleton cards, empty state with messaging, refresh functionality, responsive grid layout
**Styling**: Section header with refresh button, grid layout, consistent spacing

---

## 🎨 Styling Patterns

### Color Usage

#### Primary Palette
```css
/* Grey Accent Colors */
--grey-accent-50: #f9fafb;   /* Very light backgrounds */
--grey-accent-100: #f3f4f6; /* Light backgrounds */
--grey-accent-200: #e5e7eb; /* Borders, dividers */
--grey-accent-300: #d1d5db; /* Muted elements */
--grey-accent-400: #9ca3af; /* Secondary text */
--grey-accent-500: #6b7280; /* Body text */
--grey-accent-600: #4b5563; /* Headings */
--grey-accent-700: #374151; /* Strong text */
--grey-accent-800: #1f2937; /* Primary buttons */
--grey-accent-900: #111827; /* Dark text */
```

#### Semantic Colors
```css
/* Success */
--green-50: #f0fdf4;
--green-600: #16a34a;

/* Error/Danger */
--red-50: #fef2f2;
--red-600: #dc2626;

/* Warning */
--yellow-50: #fffbeb;
--yellow-600: #d97706;

/* Info */
--blue-50: #eff6ff;
--blue-600: #2563eb;
```

### Typography Scale
```css
/* Headings */
.h1 { font-size: 2.25rem; font-weight: 700; } /* 36px */
.h2 { font-size: 1.875rem; font-weight: 600; } /* 30px */
.h3 { font-size: 1.5rem; font-weight: 600; }   /* 24px */
.h4 { font-size: 1.25rem; font-weight: 600; }  /* 20px */

/* Body Text */
.body-lg { font-size: 1.125rem; line-height: 1.75; } /* 18px */
.body-md { font-size: 1rem; line-height: 1.5; }     /* 16px */
.body-sm { font-size: 0.875rem; line-height: 1.25; } /* 14px */

/* Labels */
.label { font-size: 0.75rem; font-weight: 500; text-transform: uppercase; }
```

### Spacing System
```css
/* Base unit: 4px */
.space-1: 4px
.space-2: 8px
.space-3: 12px
.space-4: 16px
.space-5: 20px
.space-6: 24px
.space-8: 32px
.space-12: 48px
.space-16: 64px
```

### Border Radius
```css
.border-radius-sm: 4px   /* Small elements */
.border-radius-md: 6px   /* Buttons, inputs */
.border-radius-lg: 8px   /* Cards, modals */
.border-radius-xl: 12px  /* Large containers */
.border-radius-2xl: 16px /* Special elements */
```

### Shadows
```css
.shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
.shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
.shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
.shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

---

## 🔄 Reusable Patterns

### Layout Patterns

#### Page Layout
```tsx
<main className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-white text-foreground font-sans">
  <div className="max-w-7xl mx-auto px-6 py-8">
    {/* Page content */}
  </div>
</main>
```
**Usage**: Standard page wrapper
**Features**: Gradient background, responsive container

#### Card Grid
```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>
```
**Usage**: Dashboard grids, team lists
**Responsive**: Single column mobile, multi-column desktop

#### Sidebar Layout
```tsx
<div className="flex">
  <aside className="w-64 bg-white border-r border-grey-accent-200">
    {/* Sidebar content */}
  </aside>
  <main className="flex-1">
    {/* Main content */}
  </main>
</div>
```
**Usage**: Admin panels, team sites
**Features**: Fixed sidebar, flexible main content

### Form Patterns

#### Form Section
```tsx
<div className="space-y-6">
  <div>
    <label className="block text-sm font-medium text-grey-accent-700 mb-2">
      Label
    </label>
    <Input
      type="text"
      value={value}
      onChange={handler}
      className="w-full"
    />
  </div>
</div>
```
**Usage**: Form fields with labels
**Styling**: Consistent spacing, label styling

#### Button Group
```tsx
<div className="flex space-x-3">
  <Button variant="default">Primary</Button>
  <Button variant="outline">Secondary</Button>
  <Button variant="ghost">Cancel</Button>
</div>
```
**Usage**: Action buttons, form controls
**Spacing**: Consistent button spacing

### Data Display Patterns

#### Status Badge
```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  Active
</span>
```
**Usage**: Status indicators, tags
**Variants**: Success (green), error (red), warning (yellow), info (blue)

#### Avatar List
```tsx
<div className="flex -space-x-2">
  {users.map(user => (
    <ProfileIcon key={user.id} user={user} size="sm" />
  ))}
</div>
```
**Usage**: Member lists, collaborators
**Styling**: Overlapping avatars

#### Empty State
```tsx
<div className="text-center py-12">
  <div className="w-16 h-16 bg-grey-accent-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
    <Icon className="w-8 h-8 text-grey-accent-400" />
  </div>
  <h3 className="text-lg font-medium text-grey-accent-900 mb-2">
    No items yet
  </h3>
  <p className="text-grey-accent-600 mb-4">
    Description of empty state
  </p>
  <Button>Add First Item</Button>
</div>
```
**Usage**: Empty lists, no data states
**Features**: Icon, title, description, action button

---

## 🎯 When to Reuse vs Create

### Reuse Existing Components When:
- **Similar Functionality**: Component does what you need with minor variations
- **Consistent UX**: Maintains design consistency across the app
- **Props Support**: Component accepts props for your use case
- **Accessibility**: Existing component is already accessible

### Extend Existing Components When:
- **Minor Variations**: Need slightly different styling or behavior
- **Composition**: Can wrap existing component with additional logic
- **Props Enhancement**: Add optional props without breaking existing usage

### Create New Components When:
- **Unique Functionality**: No existing component serves the purpose
- **Domain Specific**: Highly specialized for a particular feature
- **Reusable Potential**: Will be used in multiple places
- **Complex Logic**: Requires significant custom behavior

### Inheritance Guidelines:
1. **Favor Composition**: Wrap components instead of deep inheritance
2. **Props Interface**: Maintain similar prop patterns
3. **Styling**: Use CSS classes for variations, not inline styles
4. **Documentation**: Update this library when adding new components

---

## 🚀 Quick Reference

### Creating a New Component
1. Check this library for existing solutions
2. Use established patterns and styling
3. Follow component API conventions
4. Add to this documentation
5. Test accessibility and responsiveness

### Common Props Pattern
```tsx
interface ComponentProps {
  className?: string;        // Custom styling
  children?: React.ReactNode; // Content composition
  onClick?: () => void;      // Event handlers
  disabled?: boolean;        // Disabled state
  loading?: boolean;         // Loading state
}
```

### CSS Class Naming
- Use Tailwind utilities
- Follow BEM for custom classes: `.component__element--modifier`
- Use design tokens for colors and spacing
- Prefer utility classes over custom CSS

### Icon Usage
- Use Lucide React icons
- Consistent sizing: `w-4 h-4`, `w-5 h-5`, `w-6 h-6`
- Color: Inherit from text color or use semantic colors
- Accessibility: Add `aria-label` when icon is interactive

---

## 🪝 Custom Hooks

### useTeamSite
```tsx
const {
  user,
  profile,
  loading,
  error,
  collections,
  bookmarks,
  teamEvents,
  presence,
  setCollections,
  setBookmarks,
  createCollection,
  deleteCollection,
  createBookmark,
  deleteBookmark,
  setError
} = useTeamSite(teamId);
```
**Purpose**: Main orchestration hook for team site functionality
**Props**: `teamId: string | string[] | undefined`
**Returns**: Combined state and actions from all sub-hooks
**Composition**: Orchestrates useAuth, useTeamData, useTeamActions, useRealtimeSubscriptions, usePresence

### useAuth
```tsx
const { user, profile, loading, checkAuth } = useAuth(teamId);
```
**Purpose**: Authentication and team membership verification
**Props**: `teamId: string | string[] | undefined`
**Returns**: User authentication state and profile data
**Dependencies**: Supabase auth, team membership checks

### useTeamData
```tsx
const {
  collections,
  bookmarks,
  teamEvents,
  presence,
  dataLoading,
  dataError,
  setCollections,
  setBookmarks,
  setTeamEvents,
  setPresence,
  loadTeamSiteData
} = useTeamData(teamId);
```
**Purpose**: Data loading and state management for team content
**Props**: `teamId: string`
**Returns**: Team data state and loading status
**Dependencies**: Supabase database queries

### useTeamActions
```tsx
const {
  actionLoading,
  createCollection,
  deleteCollection,
  createBookmark,
  deleteBookmark
} = useTeamActions(teamId, user, profile, setError);
```
**Purpose**: CRUD operations for collections and bookmarks
**Props**: `teamId: string, user: any, profile: any, setError: Dispatch<SetStateAction<string | null>>`
**Returns**: Action functions and loading state
**Dependencies**: Supabase mutations, error handling

### useRealtimeSubscriptions
```tsx
useRealtimeSubscriptions({
  teamId,
  user,
  setCollections,
  setBookmarks,
  setTeamEvents,
  setPresence
});
```
**Purpose**: Manages Supabase realtime subscriptions for live updates
**Props**: Team ID, user, and state setter functions
**Returns**: None (manages subscriptions internally)
**Dependencies**: Supabase realtime channels

### usePresence
```tsx
const { updatePresence } = usePresence({ teamId, user, authLoading, dataLoading });
```
**Purpose**: Presence management and activity tracking
**Props**: `teamId: string, user: any, authLoading: boolean, dataLoading: boolean`
**Returns**: Presence update function
**Dependencies**: Supabase presence table, activity event listeners

### useAdminPanel
```tsx
const {
  teams,
  users,
  selectedTeam,
  selectedUser,
  loading,
  error,
  createTeam,
  updateTeam,
  deleteTeam,
  addUserToTeam,
  removeUserFromTeam,
  updateUserRole
} = useAdminPanel();
```
**Purpose**: Admin panel state and operations for team and user management
**Returns**: Teams, users data and CRUD operations
**Dependencies**: Supabase admin operations, team/user management

### useMemberManagement
```tsx
const {
  teamMembers,
  availableUsers,
  loading,
  addMember,
  removeMember,
  updateMemberRole
} = useMemberManagement(teamId);
```
**Purpose**: User membership management for specific teams
**Props**: `teamId: string`
**Returns**: Team members, available users, and membership operations
**Dependencies**: Supabase team membership queries and mutations

### useTeamManagement
```tsx
const {
  teams,
  loading,
  createTeam,
  updateTeam,
  deleteTeam,
  refreshTeams
} = useTeamManagement();
```
**Purpose**: Team CRUD operations and management
**Returns**: Teams data and team management functions
**Dependencies**: Supabase team operations, user permissions

### useModalState
```tsx
const {
  showDirectoryModal,
  selectedDirectoryCollection,
  showCreateCollection,
  showAddBookmark,
  selectedBookmark,
  bookmarkViewMode,
  showHighlightTooltip,
  tooltipPosition,
  pendingSelection,
  newAnnotation,
  highlightColor,
  tagInput,
  showTagSuggestions,
  commentInputs,
  setShowDirectoryModal,
  setSelectedDirectoryCollection,
  setShowCreateCollection,
  setShowAddBookmark,
  setSelectedBookmark,
  setBookmarkViewMode,
  setShowHighlightTooltip,
  setTooltipPosition,
  setPendingSelection,
  setNewAnnotation,
  setHighlightColor,
  setTagInput,
  setShowTagSuggestions,
  setCommentInputs,
  resetBookmarkModal,
  resetHighlightState
} = useModalState();
```
**Purpose**: Centralized state management for all modal-related UI state
**Returns**: Modal state and actions for directory modals, bookmark details, highlighting, and annotations
**Composition**: Consolidates modal state that was previously scattered across useState calls
**Benefits**: Cleaner component code, centralized modal logic, easier testing

### useUIHandlers
```tsx
const {
  toggleCollection,
  handleBookmarkClick,
  updateBookmarkTags,
  updateSelectedBookmarkTags,
  handleCreateAction
} = useUIHandlers({
  setSelectedCollectionId,
  setExpandedCollections,
  setSelectedBookmark,
  setBookmarkViewMode,
  setShowCreateCollection,
  setShowAddBookmark,
  fetchBookmarkData,
  activeTab,
  supabase,
  setError,
  selectedBookmark
});
```
**Purpose**: Event handlers for user interactions and UI state changes
**Props**: State setters, data fetching functions, and dependencies
**Returns**: UI event handler functions for collections, bookmarks, and navigation
**Composition**: Groups related event handlers that were previously inline functions
**Benefits**: Separated concerns, reusable handlers, easier testing

### useFilterState
```tsx
const {
  viewMode,
  searchQuery,
  activeTab,
  bookmarkFilters,
  showFilters,
  collectionFilters,
  showCollectionFilters,
  setViewMode,
  setSearchQuery,
  setActiveTab,
  setBookmarkFilters,
  setShowFilters,
  setCollectionFilters,
  setShowCollectionFilters
} = useFilterState();
```
**Purpose**: State management for view modes, search, and advanced filtering
**Returns**: View state, search state, and filter configurations for bookmarks and collections
**Composition**: Consolidates filter-related state that was previously scattered
**Benefits**: Centralized filter logic, consistent filter interfaces, easier state management

### useDragDrop
```tsx
const {
  draggedCollection,
  draggedBookmark,
  dragOverTarget,
  dragOverData,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleBookmarkDragStart,
  handleBookmarkDragOver,
  handleBookmarkDrop
} = useDragDrop({
  user,
  profile,
  collections,
  bookmarks,
  setCollections,
  setBookmarks,
  setError
});
```
**Purpose**: Drag and drop functionality for collections and bookmarks
**Props**: User data, collections/bookmarks arrays, and state setters
**Returns**: Drag state and event handlers for collection/bookmark reordering
**Dependencies**: Supabase for persistence, React state for UI feedback
**Benefits**: Complex drag-drop logic extracted from components

---

## 🛠️ Utility Functions

### filterUtils
```tsx
import {
  filterBookmarks,
  filterCollections,
  getAllTags,
  getAvailableTags,
  getAllCreators,
  getAllCollectionCreators,
  getParentCollections,
  BookmarkFilterState,
  CollectionFilterState
} from '../../utils/filterUtils';
```
**Purpose**: Advanced filtering logic for bookmarks and collections
**Functions**:
- `filterBookmarks(bookmarks, filters)`: Filter bookmarks by search, tags, collections, creators, date range, sort
- `filterCollections(collections, filters, bookmarks)`: Filter collections by search, creators, parents, bookmark count, sort
- `getAllTags(bookmarks)`: Extract all unique tags from bookmarks
- `getAvailableTags(bookmarks)`: Get tags with usage counts for suggestions
- `getAllCreators(bookmarks)`: Get unique bookmark creators
- `getAllCollectionCreators(collections)`: Get unique collection creators
- `getParentCollections(collections)`: Get collections that have children
**Usage**: Advanced filtering in team site components
**Dependencies**: Bookmark and Collection interfaces

### directoryUtils
```tsx
import {
  generateDirectoryStructure,
  getCollectionDirectoryMarkdown,
  copyDirectoryStructure
} from '../../utils/directoryUtils';
```
**Purpose**: Directory structure generation and clipboard operations
**Functions**:
- `generateDirectoryStructure(collection)`: Generate markdown directory structure
- `getCollectionDirectoryMarkdown(collection, bookmarks)`: Convert collection tree to markdown
- `copyDirectoryStructure(collection, bookmarks)`: Copy directory to clipboard
**Usage**: Directory export functionality in collection modals
**Dependencies**: ExtendedCollection interface, bookmarks array

### collectionTreeUtils
```tsx
import {
  buildCollectionTree,
  flattenCollections,
  updateCollectionBookmarkCounts
} from '../../utils/collectionTreeUtils';
```
**Purpose**: Collection tree building and manipulation utilities
**Functions**:
- `buildCollectionTree(collections)`: Build hierarchical collection tree from flat array
- `flattenCollections(tree)`: Flatten tree back to array with parent/child relationships
- `updateCollectionBookmarkCounts(tree, bookmarks)`: Update bookmark counts for all collections
**Usage**: Collection tree rendering and state management
**Dependencies**: Collection interface from types/api

---

## � Bookmark Modal Components
```
**Purpose**: Team CRUD operations and management
**Returns**: Teams data and team management functions
**Dependencies**: Supabase team operations, user permissions

---

## � Bookmark Modal Components

### BookmarkModalHeader
```tsx
<BookmarkModalHeader bookmark={bookmark} onClose={onClose} />
```
**Purpose**: Header section of bookmark detail modal with title, URL, and action buttons
**Props**:
- `bookmark`: Bookmark object with title, url, preview_image
- `onClose`: Close modal callback
**Usage**: Top section of BookmarkDetailModal
**Styling**: Header layout with bookmark preview and action buttons

### BookmarkContentViewer
```tsx
<BookmarkContentViewer
  viewMode={viewMode}
  extractedContent={extractedContent}
  isLoadingContent={isLoadingContent}
  proxyContent={proxyContent}
  isLoadingProxy={isLoadingProxy}
  highlights={highlights}
  annotations={annotations}
  bookmark={bookmark}
  onViewModeChange={onViewModeChange}
/>
```
**Purpose**: Main content display area with reader/proxy/details view modes
**Props**:
- `viewMode`: "reader" | "proxy" | "details"
- `extractedContent`: Parsed content object
- `isLoadingContent`: Loading state for content extraction
- `proxyContent`: HTML string for proxy view
- `isLoadingProxy`: Loading state for proxy content
- `highlights`: Array of highlight objects
- `annotations`: Array of annotation objects
- `bookmark`: Bookmark object
- `onViewModeChange`: View mode change callback
**Usage**: Central content area of BookmarkDetailModal
**Styling**: Tabbed interface with responsive content display

### BookmarkTagManager
```tsx
<BookmarkTagManager
  bookmarkTags={bookmarkTags}
  tagInput={tagInput}
  showTagSuggestions={showTagSuggestions}
  availableTags={availableTags}
  onUpdateTags={onUpdateTags}
  onSetTagInput={onSetTagInput}
  onSetShowTagSuggestions={onSetShowTagSuggestions}
/>
```
**Purpose**: Tag management interface with autocomplete and suggestions
**Props**:
- `bookmarkTags`: Array of current tags
- `tagInput`: Current input value
- `showTagSuggestions`: Whether to show suggestions dropdown
- `availableTags`: Array of available tags with usage counts
- `onUpdateTags`: Update tags callback
- `onSetTagInput`: Set input value callback
- `onSetShowTagSuggestions`: Toggle suggestions callback
**Usage**: Tag management within bookmark modals
**Styling**: Input with dropdown suggestions and tag chips

### BookmarkAnnotationsSidebar
```tsx
<BookmarkAnnotationsSidebar
  annotations={annotations}
  highlights={highlights}
  newAnnotation={newAnnotation}
  user={user}
  teamId={teamId}
  bookmarkTags={bookmarkTags}
  tagInput={tagInput}
  showTagSuggestions={showTagSuggestions}
  availableTags={availableTags}
  commentInputs={commentInputs}
  bookmark={bookmark}
  onCreateAnnotation={onCreateAnnotation}
  onToggleAnnotationLike={onToggleAnnotationLike}
  onDeleteAnnotation={onDeleteAnnotation}
  onSetNewAnnotation={onSetNewAnnotation}
  onUpdateTags={onUpdateTags}
  onSetTagInput={onSetTagInput}
  onSetShowTagSuggestions={onSetShowTagSuggestions}
  onSetCommentInputs={onSetCommentInputs}
/>
```
**Purpose**: Right sidebar with annotations, comments, and tag management
**Props**:
- `annotations`: Array of annotation objects
- `highlights`: Array of highlight objects
- `newAnnotation`: New annotation text
- `user`: Current user object
- `teamId`: Team identifier
- `bookmarkTags`: Current bookmark tags
- `tagInput`: Tag input value
- `showTagSuggestions`: Show tag suggestions flag
- `availableTags`: Available tags array
- `commentInputs`: Comment input states
- `bookmark`: Bookmark object
- `onCreateAnnotation`: Create annotation callback
- `onToggleAnnotationLike`: Like annotation callback
- `onDeleteAnnotation`: Delete annotation callback
- `onSetNewAnnotation`: Set annotation text callback
- `onUpdateTags`: Update tags callback
- `onSetTagInput`: Set tag input callback
- `onSetShowTagSuggestions`: Toggle suggestions callback
- `onSetCommentInputs`: Set comment inputs callback
**Usage**: Right sidebar of BookmarkDetailModal
**Styling**: Chat-like interface with expandable conversations

### BookmarkHighlightTooltip
```tsx
<BookmarkHighlightTooltip
  pendingSelection={pendingSelection}
  tooltipPosition={tooltipPosition}
  highlightColor={highlightColor}
  newAnnotation={newAnnotation}
  colorOptions={colorOptions}
  onSetHighlightColor={onSetHighlightColor}
  onSetNewAnnotation={onSetNewAnnotation}
  onSetShowHighlightTooltip={onSetShowHighlightTooltip}
  onSetPendingSelection={onSetPendingSelection}
  saveHighlight={saveHighlight}
  onCreateAnnotation={onCreateAnnotation}
  bookmark={bookmark}
/>
```
**Purpose**: Tooltip for text selection highlighting with color picker and annotation input
**Props**:
- `pendingSelection`: Selected text object with offsets
- `tooltipPosition`: Tooltip position coordinates
- `highlightColor`: Current highlight color
- `newAnnotation`: Annotation text
- `colorOptions`: Array of available colors
- `onSetHighlightColor`: Set highlight color callback
- `onSetNewAnnotation`: Set annotation callback
- `onSetShowHighlightTooltip`: Toggle tooltip callback
- `onSetPendingSelection`: Set selection callback
- `saveHighlight`: Save highlight function
- `onCreateAnnotation`: Create annotation callback
- `bookmark`: Bookmark object
**Usage**: Text selection highlighting interface
**Styling**: Floating tooltip with color picker and form inputs

---

## �📝 Maintenance

**Update this document when:**
- Adding new reusable components
- Modifying existing component APIs
- Changing design patterns or styling
- Discovering new reusable patterns

**Review periodically for:**
- Outdated components
- Missing documentation
- Inconsistent patterns
- Performance improvements