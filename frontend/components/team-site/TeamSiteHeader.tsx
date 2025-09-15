import { useRouter } from 'next/router';
import { Presence } from '../../types/api';

interface TeamSiteHeaderProps {
  presence: Presence[];
}

export default function TeamSiteHeader({ presence }: TeamSiteHeaderProps) {
  const router = useRouter();

  return (
    <header className="border-b transition-all duration-200" style={{ 
      backgroundColor: 'var(--surface)', 
      borderColor: 'var(--border)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{ 
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--background)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="h-6 w-px" style={{ backgroundColor: 'var(--border)' }}></div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Team Workspace
            </h1>
          </div>
          
          {/* Online members */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {presence.length === 0 ? 'No one online' : `${presence.length} online`}
                </span>
              </div>
              
              {presence.length > 0 && (
                <div className="flex -space-x-2">
                  {presence.slice(0, 5).map((p: any) => {
                    console.log('Presence item:', p); // Debug log
                    const displayName = p.profiles?.full_name || p.profiles?.user_id || 'Unknown User';
                    const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                    
                    return (
                      <div
                        key={p.user_id}
                        className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold relative transition-all duration-200 hover:transform hover:-translate-y-1 hover:z-10"
                        style={{ 
                          borderColor: 'var(--surface)',
                          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                          color: 'var(--background)',
                          boxShadow: 'var(--shadow-md)'
                        }}
                        title={`${displayName} (Online)`}
                      >
                        {p.profiles?.avatar_url ? (
                          <img 
                            src={p.profiles.avatar_url} 
                            alt={displayName}
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              console.log('Avatar failed to load for:', displayName);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                        {/* Online indicator */}
                        <div 
                          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2"
                          style={{ 
                            backgroundColor: '#10B981',
                            borderColor: 'var(--surface)'
                          }}
                        ></div>
                      </div>
                    );
                  })}
                  {presence.length > 5 && (
                    <div 
                      className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium"
                      style={{ 
                        borderColor: 'var(--surface)',
                        backgroundColor: 'var(--border)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      +{presence.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}