"use client"

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Folder, Grid3X3, List, ExternalLink, Copy, ChevronDown, ChevronRight, Search, Plus, Share2, Settings, Users, Home, Bookmark, Activity } from 'lucide-react';
import ProfileIcon from '../../ProfileIcon';
import { FaviconImage } from './FaviconImage';
import { DirectoryModal } from './DirectoryModal';
import BookmarkFilters from '../bookmarks/BookmarkFilters';
import { MainTabContent } from './MainTabContent';
import { BookmarksTabContent } from './BookmarksTabContent';
import { CollectionsTabContent } from './CollectionsTabContent';
import { ActivityTabContent } from './ActivityTabContent';

interface ExtendedCollection {
  id: string;
  name: string;
  description?: string;
  color: string;
  team_id: string;
  created_at: string;
  created_by: string;
  profiles?: {
    user_id: string;
    full_name?: string;
    avatar_url?: string;
  };
  bookmarkCount?: number;
  children?: ExtendedCollection[];
  parentId?: string;
}

interface TeamSiteMainContentProps {
  activeTab: string;
  viewMode: 'grid' | 'list';
  searchQuery: string;
  collections: ExtendedCollection[];
  bookmarks: any[];
  nestedCollections: ExtendedCollection[];
  expandedCollections: Set<string>;
  selectedCollectionId: string | null;
  advancedFilteredBookmarks: any[];
  bookmarkFilters: any;
  showFilters: boolean;
  filteredCollections: ExtendedCollection[];
  collectionFilters: any;
  showCollectionFilters: boolean;
  allTags: string[];
  allCreators: string[];
  allCollectionCreators: string[];
  parentCollections: ExtendedCollection[];
  allFlatCollections: ExtendedCollection[];
  teamEvents: any[];
  selectedDirectoryCollection: ExtendedCollection | null;
  showDirectoryModal: boolean;
  onActiveTabChange: (tab: string) => void;
  onSearchQueryChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onToggleCollection: (collectionId: string) => void;
  onSelectCollection: (collectionId: string | null) => void;
  onBookmarkClick: (bookmark: any) => void;
  onSetBookmarkFilters: (filters: any) => void;
  onSetShowFilters: (show: boolean) => void;
  onSetCollectionFilters: (filters: any) => void;
  onSetShowCollectionFilters: (show: boolean) => void;
  onSetSelectedDirectoryCollection: (collection: ExtendedCollection | null) => void;
  onSetShowDirectoryModal: (show: boolean) => void;
  onCopyDirectoryStructure: (collection: ExtendedCollection) => void;
  dragOverData: any;
  draggedCollection: string | null;
  draggedBookmark: string | null;
  dragOverTarget: string | null;
  onHandleDragStart: (e: any, collectionId: string) => void;
  onHandleDragEnd: () => void;
  onHandleDragOver: (e: any, collectionId: string) => void;
  onHandleDragLeave: (e: any) => void;
  onHandleDrop: (e: any, collectionId: string) => Promise<void>;
  onHandleBookmarkDragStart: (e: any, bookmarkId: string) => void;
  onHandleBookmarkDragOver: (e: any, collectionId: string) => void;
  onHandleBookmarkDrop: (e: any, collectionId: string) => void;
  onCreateCollection: () => void;
  onCreateBookmark: () => void;
}

export const TeamSiteMainContent: React.FC<TeamSiteMainContentProps> = ({
  activeTab,
  viewMode,
  searchQuery,
  collections,
  bookmarks,
  nestedCollections,
  expandedCollections,
  selectedCollectionId,
  advancedFilteredBookmarks,
  bookmarkFilters,
  showFilters,
  filteredCollections,
  collectionFilters,
  showCollectionFilters,
  allTags,
  allCreators,
  allCollectionCreators,
  parentCollections,
  allFlatCollections,
  teamEvents,
  selectedDirectoryCollection,
  showDirectoryModal,
  onActiveTabChange,
  onSearchQueryChange,
  onViewModeChange,
  onToggleCollection,
  onSelectCollection,
  onBookmarkClick,
  onSetBookmarkFilters,
  onSetShowFilters,
  onSetCollectionFilters,
  onSetShowCollectionFilters,
  onSetSelectedDirectoryCollection,
  onSetShowDirectoryModal,
  onCopyDirectoryStructure,
  dragOverData,
  draggedCollection,
  draggedBookmark,
  dragOverTarget,
  onHandleDragStart,
  onHandleDragEnd,
  onHandleDragOver,
  onHandleDragLeave,
  onHandleDrop,
  onHandleBookmarkDragStart,
  onHandleBookmarkDragOver,
  onHandleBookmarkDrop,
  onCreateCollection,
  onCreateBookmark
}) => {
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={onActiveTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12 p-1 text-slate-600 bg-slate-200 rounded-xl">
          <TabsTrigger
            value="main"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="bookmarks"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            Bookmarks ({bookmarks.length})
          </TabsTrigger>
          <TabsTrigger
            value="collections"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-colors"
          >
            <Folder className="w-4 h-4" />
            Collections ({collections.length})
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg transition-colors"
          >
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-8 mt-6">
          <MainTabContent
            viewMode={viewMode}
            collections={nestedCollections}
            selectedCollectionId={selectedCollectionId}
            advancedFilteredBookmarks={advancedFilteredBookmarks}
            bookmarkFilters={bookmarkFilters}
            expandedCollections={expandedCollections}
            bookmarks={bookmarks}
            dragOverData={dragOverData}
            draggedCollection={draggedCollection}
            draggedBookmark={draggedBookmark}
            dragOverTarget={dragOverTarget}
            onViewModeChange={onViewModeChange}
            onBookmarkClick={onBookmarkClick}
            onSetBookmarkFilters={onSetBookmarkFilters}
            onToggleCollection={onToggleCollection}
            onSetSelectedCollectionId={onSelectCollection}
            onHandleDragStart={onHandleDragStart}
            onHandleDragEnd={onHandleDragEnd}
            onHandleDragOver={onHandleDragOver}
            onHandleDragLeave={onHandleDragLeave}
            onHandleDrop={onHandleDrop}
            onHandleBookmarkDragStart={onHandleBookmarkDragStart}
            onHandleBookmarkDragOver={onHandleBookmarkDragOver}
            onHandleBookmarkDrop={onHandleBookmarkDrop}
            onCreateCollection={onCreateCollection}
            onCreateBookmark={onCreateBookmark}
          />
        </TabsContent>

        <TabsContent value="bookmarks" className="space-y-6 mt-6">
          <BookmarksTabContent
            viewMode={viewMode}
            advancedFilteredBookmarks={advancedFilteredBookmarks}
            bookmarkFilters={bookmarkFilters}
            showFilters={showFilters}
            allTags={allTags}
            collections={collections}
            allCreators={allCreators}
            onBookmarkClick={onBookmarkClick}
            onSetBookmarkFilters={onSetBookmarkFilters}
            onSetShowFilters={onSetShowFilters}
          />
        </TabsContent>

        <TabsContent value="collections" className="space-y-6 mt-6">
          <CollectionsTabContent
            filteredCollections={filteredCollections}
            collectionFilters={collectionFilters}
            showCollectionFilters={showCollectionFilters}
            allCollectionCreators={allCollectionCreators}
            parentCollections={parentCollections}
            allFlatCollections={allFlatCollections}
            bookmarks={bookmarks}
            onSetShowCollectionFilters={onSetShowCollectionFilters}
            onSetCollectionFilters={onSetCollectionFilters}
            onSetSelectedDirectoryCollection={onSetSelectedDirectoryCollection}
            onSetShowDirectoryModal={onSetShowDirectoryModal}
            onCopyDirectoryStructure={onCopyDirectoryStructure}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          <ActivityTabContent teamEvents={teamEvents} />
        </TabsContent>
      </Tabs>

      <DirectoryModal
        isOpen={showDirectoryModal}
        collection={selectedDirectoryCollection}
        bookmarks={bookmarks}
        onClose={() => {
          onSetShowDirectoryModal(false);
          onSetSelectedDirectoryCollection(null);
        }}
        onCopy={onCopyDirectoryStructure}
      />
    </div>
  );
};