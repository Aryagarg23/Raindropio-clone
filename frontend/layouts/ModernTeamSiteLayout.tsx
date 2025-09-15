import React, { useState } from 'react';
import { ReactNode } from 'react';
import { Collection, Bookmark, Presence } from '../types/api';
import Sidebar from '../components/team-site/Sidebar';
import MainContent from '../components/team-site/MainContent';

interface ModernTeamSiteLayoutProps {
  children?: ReactNode;
  collections: Collection[];
  bookmarks: Bookmark[];
  presence: Presence[];
  onCreateCollection: () => void;
  onCreateBookmark: () => void;
  loading?: boolean;
}

export default function ModernTeamSiteLayout({
  children,
  collections,
  bookmarks,
  presence,
  onCreateCollection,
  onCreateBookmark,
  loading = false
}: ModernTeamSiteLayoutProps) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <Sidebar
          collections={collections}
          selectedCollection={selectedCollection}
          onCollectionSelect={setSelectedCollection}
          onCreateCollection={onCreateCollection}
          presence={presence}
          totalBookmarks={bookmarks.length}
          className="h-screen"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Team Workspace</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Global Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search all bookmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">U</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1">
          {children ? (
            children
          ) : (
            <MainContent
              bookmarks={bookmarks}
              collections={collections}
              selectedCollection={selectedCollection}
              onBookmarkAdd={onCreateBookmark}
              searchQuery={searchQuery}
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}