import React from 'react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div style={{ 
      background: 'var(--accent)', 
      color: '#fff', 
      padding: 16, 
      borderRadius: 'var(--rounded-md)', 
      marginBottom: 24, 
      fontWeight: 600,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: 'var(--shadow-md)',
      animation: 'slideInFromTop 0.3s ease-out'
    }}>
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 'var(--rounded-sm)',
            opacity: 0.8,
            transition: 'opacity var(--transition-speed) var(--transition-ease)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          ✕
        </button>
      )}
    </div>
  );
}