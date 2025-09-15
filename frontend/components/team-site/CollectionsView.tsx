import { Collection, Bookmark } from '../../types/api';

interface CollectionsViewProps {
  collections: Collection[];
  bookmarks: Bookmark[];
  onCollectionClick: (collectionId: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onCreateBookmark: (collectionId: string) => void;
}

export default function CollectionsView({
  collections,
  bookmarks,
  onCollectionClick,
  onDeleteCollection,
  onCreateBookmark
}: CollectionsViewProps) {
  const getBookmarkCount = (collectionId: string) => {
    return bookmarks.filter(b => b.collection_id === collectionId).length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          No collections yet
        </h3>
        <p className="text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Create your first collection to start organizing bookmarks with your team.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {collections.map((collection) => (
        <div
          key={collection.id}
          className="group relative rounded-xl p-6 transition-all duration-200 cursor-pointer hover:transform hover:-translate-y-2"
          style={{ 
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
          onClick={() => onCollectionClick(collection.id)}
        >
          {/* Collection Icon */}
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4"
            style={{ 
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: 'var(--background)'
            }}
          >
            📁
          </div>

          {/* Collection Header */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-sm line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                {collection.description}
              </p>
            )}
          </div>

          {/* Collection Stats */}
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center space-x-2">
              <span style={{ color: 'var(--text-secondary)' }}>
                {getBookmarkCount(collection.id)} bookmarks
              </span>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>
              {formatDate(collection.created_at)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateBookmark(collection.id);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 opacity-0 group-hover:opacity-100"
              style={{ 
                backgroundColor: 'var(--primary)',
                color: 'var(--background)'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Add Bookmark</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${collection.name}"?`)) {
                  onDeleteCollection(collection.id);
                }
              }}
              className="p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>

          {/* Collection Color Bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
            style={{ 
              background: collection.color || 'linear-gradient(90deg, var(--primary), var(--secondary))'
            }}
          ></div>
        </div>
      ))}
    </div>
  );
}