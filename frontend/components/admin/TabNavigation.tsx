import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  tabs: { id: string; label: string }[];
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ activeTab, tabs, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-1 mb-8 bg-grey-accent-100 p-1 rounded-lg w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-white text-grey-accent-900 shadow-sm'
              : 'text-grey-accent-600 hover:text-grey-accent-800 hover:bg-grey-accent-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}