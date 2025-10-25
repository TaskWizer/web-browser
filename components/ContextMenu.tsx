import React, { useEffect, useRef, useState } from 'react';
// FIX: Use the shared ContextMenuAction type from types.ts.
import type { ContextMenuAction } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  actions: ContextMenuAction[];
}

const ContextMenuItem: React.FC<{ item: ContextMenuAction & { disabled?: boolean }, onClose: () => void }> = ({ item, onClose }) => {
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
    const hasSubMenu = !!item.subActions;

    const handleClick = () => {
        if (item.disabled) return;
        if (item.action) {
            item.action();
            onClose();
        }
    }

    return (
        <div 
            className="relative" 
            onMouseEnter={() => hasSubMenu && !item.disabled && setIsSubMenuOpen(true)}
            onMouseLeave={() => hasSubMenu && setIsSubMenuOpen(false)}
        >
            <button
              onClick={handleClick}
              disabled={item.disabled}
              className="w-full text-left px-3 py-1.5 text-sm text-zinc-200 hover:bg-indigo-600 hover:text-white flex justify-between items-center disabled:text-zinc-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <span>{item.label}</span>
              {hasSubMenu && <span className="text-xs">▶</span>}
            </button>
            {isSubMenuOpen && hasSubMenu && (
                <div className="absolute left-full -top-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 w-48">
                    {item.subActions?.map(subItem => (
                        <ContextMenuItem key={subItem.label} item={subItem} onClose={onClose} />
                    ))}
                </div>
            )}
        </div>
    )
}


export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, actions }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault();
        onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('contextmenu', handleContextMenu);
    }
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="absolute z-50 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 w-48 animate-in fade-in zoom-in-95 duration-100"
    >
      {actions.map((item) => <ContextMenuItem key={item.label} item={item} onClose={onClose} /> )}
    </div>
  );
};
