import React from 'react';
import type { Tab } from '../types';
import { NEW_TAB_URL, ABOUT_SETTINGS_URL } from '../constants';
import { NewTabPage } from './NewTabPage';
import { GeminiSearchResult } from './GeminiSearchResult';
import { SettingsPage } from './SettingsPage';

interface PagePreviewProps {
  tab: Tab;
}

const PagePreview: React.FC<PagePreviewProps> = ({ tab }) => {
  if (tab.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-zinc-400">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin mb-4"></div>
        Loading page for {tab.url}...
      </div>
    );
  }

  if (tab.screenshotUrl) {
    return (
      <div className="relative w-full h-full bg-zinc-800 group">
        <img 
            src={tab.screenshotUrl} 
            alt={`Screenshot of ${tab.title}`} 
            className="w-full h-full object-contain" 
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <a 
                href={tab.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-500 transition-colors text-lg font-semibold"
            >
                Open Site in a New Secure Tab
            </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-zinc-300 text-center p-4">
        <h2 className="text-2xl font-semibold text-red-400 mb-2">Could not load page preview</h2>
        <p className="text-zinc-400 mb-6 max-w-md">The page might be offline, block screenshot services, or the URL may be incorrect.</p>
        <a 
            href={tab.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-500 transition-colors"
        >
            Try Opening in New Tab
        </a>
    </div>
  );
};


interface BrowserViewProps {
  activeTab: Tab | undefined;
  onSearch: (query: string) => void;
  onNavigate: (url: string) => void;
}

export const BrowserView: React.FC<BrowserViewProps> = ({ activeTab, onSearch, onNavigate }) => {
  if (!activeTab) {
    return (
      <div className="flex-grow bg-zinc-900 flex items-center justify-center text-zinc-500 h-full">
        No active tab. Create one to get started.
      </div>
    );
  }
  
  const viewContent = () => {
    if (activeTab.geminiSearchResult) {
      return <GeminiSearchResult result={activeTab.geminiSearchResult} />;
    }

    switch (activeTab.url) {
      case NEW_TAB_URL:
        return <NewTabPage onSearch={onSearch} />;
      case ABOUT_SETTINGS_URL:
        return <SettingsPage onNavigate={onNavigate} />;
      default:
        if (activeTab.url.startsWith('about:') || activeTab.url.startsWith('gemini://')) {
          return <NewTabPage onSearch={onSearch} />;
        }
        return <PagePreview tab={activeTab} />;
    }
  }

  return (
    <div className="flex-grow bg-zinc-900 h-full">
      {viewContent()}
    </div>
  );
};