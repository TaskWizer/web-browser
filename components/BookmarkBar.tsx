import React, { useState } from 'react';
import type { Bookmark } from '../types';

interface BookmarkBarProps {
  bookmarks: Bookmark[];
  onSelectBookmark: (url: string) => void;
  onNavigateInNewTab: (url: string) => void;
  onDrop: (url: string) => void;
  onBookmarkContextMenu?: (e: React.MouseEvent, bookmarkId: string) => void;
  onToolbarContextMenu?: (e: React.MouseEvent) => void;
}

const getFaviconUrl = (bookmark: Bookmark) => {
    // Use custom icon if provided
    if (bookmark.iconUrl) {
        return bookmark.iconUrl;
    }
    // Otherwise use Google favicon service
    try {
        const hostname = new URL(bookmark.url).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
    } catch (error) {
        return `https://www.google.com/s2/favicons?domain=google.com`;
    }
}

export const BookmarkBar: React.FC<BookmarkBarProps> = ({
  bookmarks,
  onSelectBookmark,
  onNavigateInNewTab,
  onDrop,
  onBookmarkContextMenu,
  onToolbarContextMenu
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
  };

  const handleDragLeave = () => {
      setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const url = e.dataTransfer.getData("text/uri-list");
      if (url) {
          onDrop(url);
      }
  };

  const handleMouseDown = (e: React.MouseEvent, url: string) => {
      if (e.button === 1) { // Middle mouse button
          e.preventDefault();
          onNavigateInNewTab(url);
      }
  };

  const handleBookmarkContextMenu = (e: React.MouseEvent, bookmarkId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling to toolbar context menu
    if (onBookmarkContextMenu) {
      onBookmarkContextMenu(e, bookmarkId);
    }
  };

  const handleToolbarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onToolbarContextMenu) {
      onToolbarContextMenu(e);
    }
  };

  return (
    <div
        className={`flex items-center bg-zinc-800 h-10 px-4 gap-2 text-sm flex-shrink-0 border-b border-zinc-700/50 transition-colors ${isDragOver ? 'bg-indigo-500/20' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleToolbarContextMenu}
    >
      {bookmarks.map(bookmark => (
        <button
            key={bookmark.id}
            onClick={() => onSelectBookmark(bookmark.url)}
            onMouseDown={(e) => handleMouseDown(e, bookmark.url)}
            onContextMenu={(e) => handleBookmarkContextMenu(e, bookmark.id)}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
        >
          <img
            src={getFaviconUrl(bookmark)}
            alt=""
            className="w-4 h-4"
            onError={(e) => {
              // Fallback to default icon on error
              e.currentTarget.src = 'https://www.google.com/s2/favicons?domain=google.com&sz=16';
            }}
          />
          <span className="text-zinc-300 truncate">{bookmark.title}</span>
        </button>
      ))}
    </div>
  );
};
