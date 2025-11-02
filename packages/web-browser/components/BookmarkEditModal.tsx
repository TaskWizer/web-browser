import React, { useState, useEffect } from 'react';
import type { Bookmark } from '../types';

interface BookmarkEditModalProps {
  bookmark: Bookmark | null;
  onSave: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
  onClose: () => void;
}

export const BookmarkEditModal: React.FC<BookmarkEditModalProps> = ({
  bookmark,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [errors, setErrors] = useState<{ title?: string; url?: string; iconUrl?: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title);
      setUrl(bookmark.url);
      setIconUrl(bookmark.iconUrl || '');
    }
  }, [bookmark]);

  const validateUrl = (urlString: string): boolean => {
    if (!urlString.trim()) return false;
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { title?: string; url?: string; iconUrl?: string } = {};
    
    // Validate title
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 50) {
      newErrors.title = 'Title must be 50 characters or less';
    }
    
    // Validate URL
    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!validateUrl(url)) {
      newErrors.url = 'Please enter a valid URL (e.g., https://example.com)';
    }
    
    // Validate icon URL (optional)
    if (iconUrl.trim() && !validateUrl(iconUrl)) {
      newErrors.iconUrl = 'Please enter a valid URL or leave empty';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    if (bookmark) {
      onSave({
        ...bookmark,
        title: title.trim(),
        url: url.trim(),
        iconUrl: iconUrl.trim() || undefined,
      });
    }
  };

  const handleDelete = () => {
    if (bookmark && showDeleteConfirm) {
      onDelete(bookmark.id);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!bookmark) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Edit Bookmark</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors({ ...errors, title: undefined });
              }}
              maxLength={50}
              className={`w-full px-3 py-2 bg-zinc-900 border ${
                errors.title ? 'border-red-500' : 'border-zinc-700'
              } rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
              placeholder="My Bookmark"
              autoFocus
            />
            {errors.title && (
              <p className="text-red-400 text-xs mt-1">{errors.title}</p>
            )}
            <p className="text-zinc-500 text-xs mt-1">{title.length}/50 characters</p>
          </div>

          {/* URL Field */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-zinc-300 mb-1">
              URL <span className="text-red-400">*</span>
            </label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrors({ ...errors, url: undefined });
              }}
              className={`w-full px-3 py-2 bg-zinc-900 border ${
                errors.url ? 'border-red-500' : 'border-zinc-700'
              } rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
              placeholder="https://example.com"
            />
            {errors.url && (
              <p className="text-red-400 text-xs mt-1">{errors.url}</p>
            )}
          </div>

          {/* Custom Icon URL Field */}
          <div>
            <label htmlFor="iconUrl" className="block text-sm font-medium text-zinc-300 mb-1">
              Custom Icon URL <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              id="iconUrl"
              type="text"
              value={iconUrl}
              onChange={(e) => {
                setIconUrl(e.target.value);
                setErrors({ ...errors, iconUrl: undefined });
              }}
              className={`w-full px-3 py-2 bg-zinc-900 border ${
                errors.iconUrl ? 'border-red-500' : 'border-zinc-700'
              } rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
              placeholder="https://example.com/icon.png"
            />
            {errors.iconUrl && (
              <p className="text-red-400 text-xs mt-1">{errors.iconUrl}</p>
            )}
            <p className="text-zinc-500 text-xs mt-1">Leave empty to use default favicon</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-800"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-800"
            >
              Cancel
            </button>
          </div>

          {/* Delete Button */}
          <div className="pt-2 border-t border-zinc-700">
            <button
              type="button"
              onClick={handleDelete}
              className={`w-full px-4 py-2 ${
                showDeleteConfirm
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              } text-white rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-800`}
            >
              {showDeleteConfirm ? 'Click Again to Confirm Delete' : 'Delete Bookmark'}
            </button>
            {showDeleteConfirm && (
              <p className="text-zinc-400 text-xs text-center mt-2">
                This action cannot be undone
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

