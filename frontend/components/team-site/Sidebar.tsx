import React, { useState } from 'react';
import { Collection, Presence } from '../../types/api';

interface SidebarProps {
  collections: Collection[];
  selectedCollection: string | null;
  onCollectionSelect: (collectionId: string | null) => void;
  onCreateCollection: () => void;
  presence: Presence[];
  totalBookmarks: number;
  className?: string;
}

export default function Sidebar({
  collections,
  selectedCollection,
  onCollectionSelect,
  onCreateCollection,
  presence,
  totalBookmarks,
  className = ''
}: SidebarProps) {
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [showActivity, setShowActivity] = useState(false);

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const onlineCount = presence.filter(p => p.is_online).length;

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Team Workspace</h2>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <span>👥</span>
            <span>{onlineCount} online</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search bookmarks..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Main Navigation */}
        <div className="p-2">
          {/* All Bookmarks */}
          <button
            onClick={() => onCollectionSelect(null)}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
              selectedCollection === null 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-3">📚</span>
            <span className="flex-1 text-left">All Bookmarks</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {totalBookmarks}
            </span>
          </button>
        </div>

        {/* Collections */}
        <div className="px-2 pb-2">
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Collections
            </h3>
            <button
              onClick={onCreateCollection}
              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title="Create collection"
            >
              <span className="text-lg">+</span>
            </button>
          </div>

          {/* Collections List */}
          <div className="space-y-1">
            {collections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isSelected={selectedCollection === collection.id}
                isExpanded={expandedCollections.has(collection.id)}
                onSelect={() => onCollectionSelect(collection.id)}
                onToggle={() => toggleCollection(collection.id)}
                level={0}
              />
            ))}
          </div>

          {collections.length === 0 && (
            <div className="px-3 py-4 text-center">
              <span className="text-4xl text-gray-300 block mb-2">📁</span>
              <p className="text-sm text-gray-500">No collections yet</p>
              <button
                onClick={onCreateCollection}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                Create your first collection
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="px-2 pb-2 border-t border-gray-100 pt-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
            Filters
          </h3>
          <div className="space-y-1">
            <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="mr-3">🏷️</span>
              <span>Tags</span>
            </button>
            <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="mr-3">🕐</span>
              <span>Recent</span>
            </button>
          </div>
        </div>

        {/* Team Activity (Collapsible) */}
        <div className="px-2 pb-2 border-t border-gray-100 pt-2">
          <button
            onClick={() => setShowActivity(!showActivity)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
          >
            <span>Team Activity</span>
            {showActivity ? (
              <span className="text-xs">▼</span>
            ) : (
              <span className="text-xs">▶</span>
            )}
          </button>
          
          {showActivity && (
            <div className="mt-2 space-y-1">
              <div className="px-3 py-2 text-xs text-gray-500">
                Activity feed coming soon...
              </div>
            </div>
          )}
        </div>

        {/* Online Members */}
        <div className="px-2 pb-4 border-t border-gray-100 pt-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
            Online Members
          </h3>
          <div className="px-3 space-y-2">
            {presence.filter(p => p.is_online).map((member) => (
              <div key={member.user_id} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-700">{member.user_id}</span>
              </div>
            ))}
            {onlineCount === 0 && (
              <p className="text-xs text-gray-500">No one online</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Collection Item Component
interface CollectionItemProps {
  collection: Collection;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
  level: number;
}

function CollectionItem({
  collection,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  level
}: CollectionItemProps) {
  const hasChildren = false; // TODO: Implement nested collections
  const paddingLeft = `${(level * 16) + 12}px`;

  return (
    <div>
      <button
        onClick={onSelect}
        className={`w-full flex items-center py-2 pr-3 text-sm rounded-lg transition-all duration-200 ${
          isSelected 
            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
            : 'text-gray-700 hover:bg-gray-50'
        }`}
        style={{ paddingLeft }}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="mr-1 p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <span className="text-xs">▼</span>
            ) : (
              <span className="text-xs">▶</span>
            )}
          </button>
        )}
        
        <div 
          className="w-3 h-3 rounded-sm mr-3 flex-shrink-0"
          style={{ backgroundColor: collection.color || '#3B82F6' }}
        />
        
        <span className="flex-1 text-left truncate">{collection.name}</span>
        
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
          0
        </span>
      </button>
    </div>
  );
}