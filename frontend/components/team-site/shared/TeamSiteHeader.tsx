import React from 'react';
import { useRouter } from "next/router";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import ProfileIcon from "../../ProfileIcon";
import { Search, Share2, Settings, Users, Grid3X3, List, Plus, Folder, ExternalLink } from "lucide-react";

interface Presence {
  user_id: string;
  is_online: boolean;
  profiles?: {
    user_id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface TeamSiteHeaderProps {
  presence: Presence[];
  bookmarksCount: number;
  collectionsCount: number;
  activeTab: string;
  searchQuery: string;
  viewMode: "grid" | "list";
  onActiveTabChange: (tab: string) => void;
  onSearchQueryChange: (query: string) => void;
  onViewModeChange: (mode: "grid" | "list") => void;
  onCreateAction: () => void;
}

export function TeamSiteHeader({
  presence,
  bookmarksCount,
  collectionsCount,
  activeTab,
  searchQuery,
  viewMode,
  onActiveTabChange,
  onSearchQueryChange,
  onViewModeChange,
  onCreateAction
}: TeamSiteHeaderProps) {
  const router = useRouter();

  return (
    <>
      {/* Header */}
      <header className="border-b border-grey-accent-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mr-2 text-grey-accent-700 hover:text-grey-accent-900 hover:bg-grey-accent-100"
              >
                ← Back to Dashboard
              </Button>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-grey-accent-900">Team Workspace</h1>
                <p className="text-sm text-grey-accent-600">Collaborative bookmark management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Online members */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-medium text-grey-accent-600">
                    {presence.length === 0 ? 'No one online' : `${presence.length} online`}
                  </span>
                </div>

                {presence.length > 0 && (
                  <div className="flex -space-x-2">
                    {presence.slice(0, 5).map((p) => {
                      const displayName = p.profiles?.full_name || p.profiles?.user_id || 'Unknown User';
                      const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

                      return (
                        <div
                          key={p.user_id}
                          title={`${displayName} (Online)`}
                        >
                          <ProfileIcon
                            user={{
                              avatar_url: p.profiles?.avatar_url,
                              full_name: p.profiles?.full_name,
                              email: p.profiles?.user_id
                            }}
                            size="md"
                            className="border-2 border-white shadow-md"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" className="border-grey-accent-300 text-grey-accent-700 hover:bg-grey-accent-100 hover:border-grey-accent-400">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="border-grey-accent-300 text-grey-accent-700 hover:bg-grey-accent-100 hover:border-grey-accent-400">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm text-grey-accent-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {presence.length} members online
            </div>
            <div className="flex items-center gap-1">
              <ExternalLink className="w-4 h-4" />
              {bookmarksCount} bookmarks
            </div>
            <div className="flex items-center gap-1">
              <Folder className="w-4 h-4" />
              {collectionsCount} collections
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-fit grid-cols-4">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookmarks..."
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              {activeTab === "main" && (
                <div className="flex items-center gap-1 border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewModeChange("grid")}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onViewModeChange("list")}
                    className="h-8 w-8 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button size="sm" onClick={onCreateAction}>
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === "collections" ? "Add Collection" : "Add Bookmark"}
              </Button>
            </div>
          </div>
      </div>
    </>
  );
}