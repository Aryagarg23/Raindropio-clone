import { ReactNode } from 'react';
import TeamSiteHeader from '../components/team-site/TeamSiteHeader';
import TeamSiteNavigation from '../components/team-site/TeamSiteNavigation';
import { Presence } from '../types/api';

interface TeamSiteLayoutProps {
  children: ReactNode;
  presence: Presence[];
  currentView: 'collections' | 'bookmarks' | 'activity';
  onViewChange: (view: 'collections' | 'bookmarks' | 'activity') => void;
  onCreateCollection: () => void;
}

export default function TeamSiteLayout({
  children,
  presence,
  currentView,
  onViewChange,
  onCreateCollection
}: TeamSiteLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <TeamSiteHeader presence={presence} />
      <TeamSiteNavigation 
        currentView={currentView}
        onViewChange={onViewChange}
        onCreateCollection={onCreateCollection}
      />
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}