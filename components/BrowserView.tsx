import React, { useState } from 'react';
import type { Tab } from '../types';
import { NEW_TAB_URL, ABOUT_SETTINGS_URL } from '../constants';
import { NewTabPage } from './NewTabPage';
import { GeminiSearchResult } from './GeminiSearchResult';
import { SettingsPage } from './SettingsPage';
import { SandboxedBrowser } from './SandboxedBrowser';
import { DocumentViewer } from './DocumentViewer';

interface PagePreviewProps {
  tab: Tab;
}

// Helper function to detect if URL is a document (PDF or eBook)
const isDocumentUrl = (url: string): boolean => {
  const urlLower = url.toLowerCase();
  return urlLower.endsWith('.pdf') || urlLower.endsWith('.epub') || urlLower.endsWith('.mobi');
};

const PagePreview: React.FC<PagePreviewProps> = ({ tab }) => {
  const [useSandboxedBrowser, setUseSandboxedBrowser] = useState(true);
  const isDocument = isDocumentUrl(tab.url);

  // Check if this is a document URL FIRST, before any other rendering logic
  if (isDocument) {
    return <DocumentViewer url={tab.url} title={tab.title} />;
  }

  if (tab.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-zinc-400">
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin mb-4"></div>
        Loading page for {tab.url}...
      </div>
    );
  }

  // If screenshot is available, show it with overlay
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
                className="px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500 transition-colors text-lg font-semibold"
            >
                Open Site in a New Secure Tab
            </a>
        </div>
      </div>
    );
  }

  // Use SandboxedBrowser for actual rendering with CORS bypass
  if (useSandboxedBrowser) {
    return (
      <div className="relative w-full h-full">
        <SandboxedBrowser url={tab.url} title={tab.title} />

        {/* Toggle button to switch to legacy view */}
        <button
          onClick={() => setUseSandboxedBrowser(false)}
          className="absolute top-2 left-2 z-10 bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-300 text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-2 transition-colors"
          title="Switch to legacy view"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Legacy View
        </button>
      </div>
    );
  }

  // Legacy fallback view (original implementation)
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-300 text-center p-8">
        <div className="max-w-2xl w-full bg-zinc-800/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-zinc-700/50">
            <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{getHostname(tab.url)}</h2>
                <p className="text-zinc-400 text-sm mb-4 break-all">{tab.url}</p>
            </div>

            <div className="space-y-4">
                <p className="text-zinc-300 leading-relaxed">
                    Legacy view mode. To view the actual website with advanced rendering, click the button below.
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => setUseSandboxedBrowser(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full shadow-lg hover:from-green-500 hover:to-emerald-500 transition-all transform hover:scale-105 font-semibold"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Try Advanced Rendering
                    </button>

                    <a
                        href={tab.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all transform hover:scale-105 font-semibold"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open in New Tab
                    </a>
                </div>
            </div>
        </div>
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
      return <GeminiSearchResult result={activeTab.geminiSearchResult} isStreaming={activeTab.geminiSearchResult.isStreaming} onSearch={onSearch} />;
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