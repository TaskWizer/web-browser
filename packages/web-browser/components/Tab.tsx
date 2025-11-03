import React from 'react';
import type { Tab as TabType } from '../types';
import { NEW_TAB_URL, ICONS } from '../constants';

interface TabProps {
  tab: TabType;
  groupColor?: string | null;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, tabId: string) => void;
}

const getFaviconUrl = (url: string) => {
    if (url === NEW_TAB_URL || url.startsWith('about:') || !URL.canParse(url)) {
        return `https://www.google.com/s2/favicons?domain=google.com`;
    }
    try {
        const hostname = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch (error) {
        return `https://www.google.com/s2/favicons?domain=google.com`;
    }
}

export const TabComponent: React.FC<TabProps> = ({ tab, groupColor, isActive, onSelect, onClose, onContextMenu }) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
        e.preventDefault();
        onClose(tab.id);
    }
    if(e.button === 0) {
        onSelect(tab.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, tab.id);
  }

  const baseClasses = "relative flex items-center h-full px-3 py-1.5 text-sm cursor-pointer group transition-all duration-200 ease-in-out border-t-2";
  const activeClasses = "bg-zinc-800 border-indigo-500 text-white";
  const inactiveClasses = "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-700/50 border-transparent";
  const tabShapeClasses = "rounded-t-lg";

  return (
    <div
      onClick={() => onSelect(tab.id)}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${tabShapeClasses} flex-shrink min-w-24 max-w-60`}
      style={{ borderTopColor: isActive ? 'rgb(99 102 241)' : groupColor ? groupColor : 'transparent' }}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {tab.isLoading ? (
            <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin flex-shrink-0"></div>
        ) : (
            <img src={getFaviconUrl(tab.url)} alt="favicon" className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="truncate flex-grow">{tab.title}</span>
      </div>
      <button
        onClick={handleClose}
        className="ml-2 p-1 rounded-full hover:bg-zinc-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        {ICONS.CLOSE}
      </button>
    </div>
  );
};

// Export as both TabComponent and Tab for compatibility
export { TabComponent as Tab };
