import React from 'react';
import type { Bookmark } from '../types';
interface BookmarkBarProps {
    bookmarks: Bookmark[];
    onSelectBookmark: (url: string) => void;
    onNavigateInNewTab: (url: string) => void;
    onDrop: (url: string) => void;
    onBookmarkContextMenu?: (e: React.MouseEvent, bookmarkId: string) => void;
    onToolbarContextMenu?: (e: React.MouseEvent) => void;
}
export declare const BookmarkBar: React.FC<BookmarkBarProps>;
export {};
//# sourceMappingURL=BookmarkBar.d.ts.map