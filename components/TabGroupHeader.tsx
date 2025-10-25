import React from 'react';
import type { TabGroup } from '../types';

interface TabGroupHeaderProps {
  group: TabGroup;
  onToggleCollapse: (groupId: string) => void;
  onContextMenu?: (e: React.MouseEvent, groupId: string) => void;
}

export const TabGroupHeader: React.FC<TabGroupHeaderProps> = ({ group, onToggleCollapse, onContextMenu }) => {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, group.id);
    }
  };

  return (
    <button
      onClick={() => onToggleCollapse(group.id)}
      onContextMenu={handleContextMenu}
      className="flex items-center gap-2 h-6 px-3 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: group.color, color: 'white' }}
    >
      <span>{group.name}</span>
    </button>
  );
};
