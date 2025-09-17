# Team Site Page ([teamId].tsx) - REFACTOR NEEDED

## Overview
This file contains the team site page implementation with 5830 lines of code. It handles bookmark management, collections, annotations, and team collaboration features.

## Current Issues
- **Excessive Size**: 5830 lines in a single file
- **Mixed Concerns**: UI, business logic, and data fetching all combined
- **Inline Components**: Many components defined inline instead of modular files
- **Complex State Management**: Large number of useState hooks
- **Poor Maintainability**: Difficult to test, debug, and extend

## Functionality

### Core Features
1. **Bookmark Management**
   - Add, edit, delete bookmarks
   - Drag-and-drop organization
   - Search and filtering
   - Bulk operations

2. **Collections**
   - Hierarchical collection structure
   - Nested collections support
   - Collection-based organization

3. **Annotations & Highlights**
   - Text highlighting in bookmark content
   - Annotation system
   - Color-coded highlights

4. **User Interface**
   - Grid/List view modes
   - Sidebar navigation
   - Modal dialogs
   - Responsive design

### State Management
- 30+ useState hooks managing various UI states
- Complex drag-and-drop state
- Bookmark and collection data
- Filtering and search state

### Components (Inline)
- `FaviconImage`: Bookmark favicon display
- `DirectoryTreeView`: Collection tree navigation
- `CreateCollectionModal`: Collection creation dialog
- `AddBookmarkModal`: Bookmark addition dialog
- And many more inline components

## Refactoring Plan

### Phase 1: Extract Components
- Move all inline components to separate files in `components/team-site/`
- Create shared components for common UI patterns
- Standardize component props and interfaces

### Phase 2: Extract Hooks
- Break down `useTeamSite.ts` (1106 lines) into smaller hooks
- Create specialized hooks for:
  - Bookmark operations
  - Collection management
  - Annotation/highlight logic
  - Drag-and-drop functionality

### Phase 3: Separate Concerns
- Extract business logic into service functions
- Create custom hooks for data fetching
- Separate UI components from data logic

### Phase 4: State Management
- Consider using Zustand or Redux for complex state
- Implement proper state normalization
- Add state persistence where needed

### Phase 5: Testing & Documentation
- Add unit tests for components and hooks
- Create integration tests for complex flows
- Document component APIs and data flow

## File Structure (Proposed)

```
components/team-site/
├── bookmarks/
│   ├── BookmarkCard.tsx
│   ├── BookmarkGrid.tsx
│   ├── BookmarkList.tsx
│   └── BookmarkModal.tsx
├── collections/
│   ├── CollectionTree.tsx
│   ├── CollectionCard.tsx
│   └── CollectionModal.tsx
├── annotations/
│   ├── HighlightTooltip.tsx
│   ├── AnnotationList.tsx
│   └── HighlightColorPicker.tsx
├── shared/
│   ├── FaviconImage.tsx
│   ├── DragHandle.tsx
│   └── LoadingState.tsx
└── layout/
    ├── TeamSiteHeader.tsx
    ├── Sidebar.tsx
    └── MainContent.tsx

hooks/
├── useBookmarks.ts
├── useCollections.ts
├── useAnnotations.ts
├── useDragDrop.ts
└── useTeamSiteFilters.ts

services/
├── bookmarkService.ts
├── collectionService.ts
└── annotationService.ts
```

## Dependencies
- Uses `useTeamSite` hook extensively
- Depends on `ProfileIcon`, `apiClient`, `supabase`
- Heavy use of Lucide icons and Radix UI components
- Mark.js for text highlighting

## Performance Considerations
- Large component with many re-renders
- Complex DOM manipulation for highlights
- Heavy state updates during drag operations
- Potential memory leaks with event listeners

## Testing Challenges
- Complex component interactions
- State-dependent behavior
- Drag-and-drop testing difficulties
- Mocking external dependencies