import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = '500px' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'var(--background)',
        borderRadius: 'var(--rounded-lg)',
        padding: '32px',
        maxWidth,
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border)',
        animation: 'slideInFromBottom 0.3s ease-out'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            color: 'var(--text-primary)', 
            margin: 0 
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--rounded-md)',
              transition: 'color var(--transition-speed) var(--transition-ease)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}