import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  tabs: { id: string; label: string }[];
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ activeTab, tabs, onTabChange }: TabNavigationProps) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 16, 
      marginBottom: 32, 
      borderBottom: '2px solid var(--border)' 
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{ 
            padding: '12px 24px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === tab.id ? 700 : 500,
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all var(--transition-speed) var(--transition-ease)'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}