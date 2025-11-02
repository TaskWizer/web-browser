import React from 'react';
import type { Bookmark } from '../types';
interface BookmarkEditModalProps {
    bookmark: Bookmark | null;
    onSave: (bookmark: Bookmark) => void;
    onDelete: (bookmarkId: string) => void;
    onClose: () => void;
}
export declare const BookmarkEditModal: React.FC<BookmarkEditModalProps>;
export {};
//# sourceMappingURL=BookmarkEditModal.d.ts.map