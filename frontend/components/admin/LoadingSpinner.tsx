import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '64px 0' 
    }}>
      <div style={{ 
        width: 48, 
        height: 48, 
        borderRadius: 'var(--rounded-full)', 
        background: 'var(--primary)', 
        margin: '0 auto', 
        marginBottom: 16, 
        animation: 'spin 1s linear infinite' 
      }} />
      <p style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '1.1rem' 
      }}>
        {message}
      </p>
    </div>
  );
}