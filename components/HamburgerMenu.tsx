import React, { useState } from 'react';
import { ICONS } from '../constants';
import { ABOUT_SETTINGS_URL } from '../constants';

interface HamburgerMenuProps {
    onNavigate: (url: string) => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
        {ICONS.MENU}
      </button>
      {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button onClick={() => onNavigate(ABOUT_SETTINGS_URL)} className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-indigo-600 hover:text-white flex items-center gap-3">
              Settings
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-zinc-400 cursor-not-allowed flex items-center gap-3">
              History <span className="text-xs text-zinc-500">(soon)</span>
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-zinc-400 cursor-not-allowed flex items-center gap-3">
              Bookmarks <span className="text-xs text-zinc-500">(soon)</span>
            </button>
            <div className="h-px bg-zinc-700 my-1"></div>
            <button className="w-full text-left px-4 py-2 text-sm text-zinc-400 cursor-not-allowed flex items-center gap-3">
              About Gemini Browser
            </button>
          </div>
      )}
    </div>
  );
};
