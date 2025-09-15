interface TeamSiteNavigationProps {
  currentView: 'collections' | 'bookmarks' | 'activity';
  onViewChange: (view: 'collections' | 'bookmarks' | 'activity') => void;
  onCreateCollection: () => void;
}

export default function TeamSiteNavigation({ 
  currentView, 
  onViewChange, 
  onCreateCollection 
}: TeamSiteNavigationProps) {
  return (
    <nav className="border-b transition-all duration-200" style={{ 
      backgroundColor: 'var(--surface)', 
      borderColor: 'var(--border)'
    }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            {[
              { id: 'collections', label: 'Collections', icon: '📚' },
              { id: 'bookmarks', label: 'All Bookmarks', icon: '🔖' },
              { id: 'activity', label: 'Team Activity', icon: '⚡' }
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium hover:transform hover:-translate-y-1 ${
                  currentView === id ? 'shadow-lg' : ''
                }`}
                style={{
                  backgroundColor: currentView === id ? 'var(--primary)' : 'transparent',
                  color: currentView === id ? 'var(--background)' : 'var(--text-secondary)',
                  boxShadow: currentView === id ? 'var(--shadow-lg)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (currentView !== id) {
                    e.currentTarget.style.backgroundColor = 'var(--background-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentView !== id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            {currentView === 'collections' && (
              <button
                onClick={onCreateCollection}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium hover:transform hover:-translate-y-1"
                style={{ 
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--background)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>New Collection</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}