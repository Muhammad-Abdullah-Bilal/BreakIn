'use client';

import React, { useState } from 'react';

type Tab = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

type ProfileTabsProps = {
  tabs: Tab[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  children: React.ReactNode;
};

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  tabs,
  defaultTabId,
  onChange,
  children
}) => {
  const [activeTab, setActiveTab] = useState(defaultTabId || tabs[0]?.id || '');
  
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };

  return (
    <div>
      <div className="border-b border-border">
        <div className="flex space-x-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="py-6">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            const childTabId = child.props.tabId;
            if (childTabId === activeTab) {
              return child;
            }
          }
          return null;
        })}
      </div>
    </div>
  );
};

type TabPanelProps = {
  tabId: string;
  children: React.ReactNode;
};

export const TabPanel: React.FC<TabPanelProps> = ({ children }) => {
  return <div>{children}</div>;
};
