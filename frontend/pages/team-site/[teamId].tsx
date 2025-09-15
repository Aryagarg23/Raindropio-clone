import { useRouter } from 'next/router';
import { useState } from 'react';
import TeamSiteLayout from '../../layouts/TeamSiteLayout';
import CollectionsView from '../../components/team-site/CollectionsView';
import BookmarksView from '../../components/team-site/BookmarksView';
import ActivityView from '../../components/team-site/ActivityView';
import CreateCollectionModal from '../../components/team-site/CreateCollectionModal';
import AddBookmarkModal from '../../components/team-site/AddBookmarkModal';
import { useTeamSite } from '../../hooks/useTeamSite';

export default function TeamSitePage() {
  const router = useRouter();
  const { teamId } = router.query;
  
  // State for UI
  const [currentView, setCurrentView] = useState<'collections' | 'bookmarks' | 'activity'>('collections');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [selectedCollectionForBookmark, setSelectedCollectionForBookmark] = useState<string | null>(null);
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string | null>(null);

  // Use the custom hook for all data management
  const {
    loading,
    error,
    user,
    collections,
    bookmarks,
    teamEvents,
    presence,
    createCollection,
    deleteCollection,
    createBookmark,
    deleteBookmark
  } = useTeamSite(teamId as string);

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading team workspace...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Access Denied
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 rounded-lg transition-colors duration-200"
            style={{ 
              backgroundColor: 'var(--primary)',
              color: 'var(--background)'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Handle not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)' }}>Please log in to access this team workspace.</p>
        </div>
      </div>
    );
  }

  // Event handlers
  const handleCreateCollection = async (data: { name: string; description: string; color: string }) => {
    await createCollection(data.name, data.description, data.color);
  };

  const handleDeleteCollection = async (collectionId: string) => {
    await deleteCollection(collectionId);
  };

  const handleCreateBookmark = async (data: {
    url: string;
    title: string;
    description: string;
    collection_id?: string;
    tags: string[];
  }) => {
    await createBookmark(data.url, data.title, data.collection_id);
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    await deleteBookmark(bookmarkId);
  };

  const handleCollectionClick = (collectionId: string) => {
    setSelectedCollectionFilter(collectionId);
    setCurrentView('bookmarks');
  };

  const handleCreateBookmarkForCollection = (collectionId: string) => {
    setSelectedCollectionForBookmark(collectionId);
    setShowBookmarkModal(true);
  };

  const handleOpenCreateCollection = () => {
    setShowCreateModal(true);
  };

  const handleOpenCreateBookmark = (collectionId?: string) => {
    setSelectedCollectionForBookmark(collectionId || null);
    setShowBookmarkModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowBookmarkModal(false);
    setSelectedCollectionForBookmark(null);
  };

  return (
    <>
      <TeamSiteLayout
        presence={presence}
        currentView={currentView}
        onViewChange={setCurrentView}
        onCreateCollection={handleOpenCreateCollection}
      >
        {/* Content based on current view */}
        {currentView === 'collections' && (
          <CollectionsView
            collections={collections}
            bookmarks={bookmarks}
            onCollectionClick={handleCollectionClick}
            onDeleteCollection={handleDeleteCollection}
            onCreateBookmark={handleCreateBookmarkForCollection}
          />
        )}

        {currentView === 'bookmarks' && (
          <BookmarksView
            bookmarks={bookmarks}
            collections={collections}
            selectedCollection={selectedCollectionFilter}
            onCollectionFilter={setSelectedCollectionFilter}
            onDeleteBookmark={handleDeleteBookmark}
            onCreateBookmark={handleOpenCreateBookmark}
          />
        )}

        {currentView === 'activity' && (
          <ActivityView events={teamEvents} />
        )}
      </TeamSiteLayout>

      {/* Modals */}
      <CreateCollectionModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
        onSubmit={handleCreateCollection}
      />

      <AddBookmarkModal
        isOpen={showBookmarkModal}
        onClose={handleCloseModals}
        onSubmit={handleCreateBookmark}
        collections={collections}
        defaultCollectionId={selectedCollectionForBookmark || undefined}
      />
    </>
  );
}