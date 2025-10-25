import React, { useState, useEffect, useRef } from 'react';
import { ICONS, NEW_TAB_URL } from '../constants';
import { HamburgerMenu } from './HamburgerMenu';
import type { Tab } from '../types';

interface AddressBarProps {
  activeTab: Tab | undefined;
  isBookmarked: boolean;
  onNavigate: (url: string) => void;
  onSearch: (query: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onToggleBookmark: () => void;
  onToggleVerticalTabs: () => void;
}

export const AddressBar: React.FC<AddressBarProps> = ({ 
  activeTab, isBookmarked, onNavigate, onSearch, onBack, onForward, onReload, onToggleBookmark, onToggleVerticalTabs 
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // This effect syncs the input value when navigating via back/forward or switching tabs.
    // CRITICAL: It MUST NOT run when the user is actively typing in the input,
    // otherwise it will overwrite their input and break navigation.
    if (activeTab && document.activeElement !== inputRef.current) {
      const displayUrl = activeTab.url.startsWith('gemini://search') 
        ? new URL(activeTab.url).searchParams.get('q') || ''
        : activeTab.url;
        
      setInputValue(displayUrl);
    }
  }, [activeTab]);
  
  const handleDragStart = (e: React.DragEvent) => {
      if (!activeTab || activeTab.url.startsWith('about:')) return;
      e.dataTransfer.setData("text/uri-list", activeTab.url);
      e.dataTransfer.setData("text/plain", activeTab.url);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || (activeTab && trimmedInput === activeTab.url)) return;

    const isUrl = trimmedInput.includes('.') || trimmedInput.startsWith('localhost') || trimmedInput.startsWith('http');
    if (isUrl) {
      const properUrl = trimmedInput.startsWith('http') ? trimmedInput : `https://${trimmedInput}`;
      onNavigate(properUrl);
    } else {
      onNavigate(`https://www.google.com/search?q=${encodeURIComponent(trimmedInput)}`);
    }
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        // Form submission is handled by onSubmit
        return;
    }
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const url = `https://www.${inputValue.trim()}.com`;
        setInputValue(url);
        onNavigate(url);
    }
  }

  const canGoBack = activeTab ? activeTab.historyIndex > 0 : false;
  const canGoForward = activeTab ? activeTab.historyIndex < activeTab.history.length - 1 : false;
  const isInternalPage = activeTab?.url.startsWith('about:') ?? true;


  return (
    <div className="flex items-center bg-zinc-800 h-12 px-2 gap-1 border-b border-zinc-700/50 flex-shrink-0">
      <button onClick={onBack} disabled={!canGoBack} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:hover:bg-transparent transition-colors">{ICONS.CHEVRON_LEFT}</button>
      <button onClick={onForward} disabled={!canGoForward} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:hover:bg-transparent transition-colors">{ICONS.CHEVRON_RIGHT}</button>
      <button onClick={onReload} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">{ICONS.RELOAD}</button>
      <button onClick={() => onNavigate(NEW_TAB_URL)} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">{ICONS.HOME}</button>
      <button onClick={onToggleVerticalTabs} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">{ICONS.VERTICAL_TABS}</button>
      
      <div className="flex-grow flex items-center relative h-full py-1.5">
        <div 
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 ${isInternalPage ? 'cursor-default' : 'cursor-grab'}`}
            draggable={!isInternalPage}
            onDragStart={handleDragStart}
        >
            {activeTab?.isSecure ? ICONS.LOCK : ICONS.INFO}
        </div>
        <form onSubmit={handleSubmit} className="w-full h-full">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.target.select()}
            className="w-full h-full bg-zinc-900 rounded-full text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-9 pr-4"
            placeholder="Search Google or enter an address"
          />
        </form>
      </div>
      
      <button onClick={onToggleBookmark} disabled={isInternalPage} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:text-zinc-600 disabled:hover:bg-transparent">
        {isBookmarked ? ICONS.BOOKMARK_FILLED : ICONS.BOOKMARK}
      </button>
      <HamburgerMenu onNavigate={onNavigate} />
    </div>
  );
};