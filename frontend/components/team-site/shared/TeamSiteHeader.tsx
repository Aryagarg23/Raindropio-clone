"use client"

import React, { useMemo } from 'react';
import { useRouter } from "next/router";
import { Button } from "../../ui/button";
import ProfileIcon from "../../ProfileIcon";
import { ArrowLeft, Users, Settings, ExternalLink, Folder } from "lucide-react";
import { MemberAvatars } from "../../shared/MemberAvatars";

interface Presence {
  user_id: string;
  last_seen: string;
  profiles?: {
    user_id: string;
    full_name?: string;
    avatar_url?: string;
    email?: string;
  };
}

interface TeamSiteHeaderProps {
  presence: Presence[];
  bookmarksCount: number;
  collectionsCount: number;
  onSettingsAction: () => void;
}

export function TeamSiteHeader({
  presence,
  bookmarksCount,
  collectionsCount,
  onSettingsAction,
}: TeamSiteHeaderProps) {
  const router = useRouter();

  const onlineMembers = useMemo(() => {
    const now = Date.now();
    const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
    return presence.filter(p => {
      if (!p.last_seen) return false;
      const lastSeenTime = new Date(p.last_seen).getTime();
      return (now - lastSeenTime) <= ONLINE_THRESHOLD_MS;
    });
  }, [presence]);

  // Transform presence data to UserProfile format for MemberAvatars
  const onlineUserProfiles = useMemo(() => {
    return onlineMembers.map(p => ({
      user_id: p.user_id,
      email: p.profiles?.email || '',
      full_name: p.profiles?.full_name,
      avatar_url: p.profiles?.avatar_url,
      role: 'member', // Default role, could be enhanced if presence includes role info
    }));
  }, [onlineMembers]);

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Team Workspace</h1>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                <div className="flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3" />
                  <span>{bookmarksCount} bookmarks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Folder className="w-3 h-3" />
                  <span>{collectionsCount} collections</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {onlineMembers.length > 0 && (
              <div className="flex items-center gap-3">
                <MemberAvatars
                  members={onlineUserProfiles}
                  maxVisible={4}
                  size="md"
                  showMemberCount={false}
                  className="flex-row-reverse"
                />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-slate-600">{onlineMembers.length} online</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onSettingsAction}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                title="Workspace Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}