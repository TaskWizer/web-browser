import React, { useRef } from 'react';
import type { Tab, TabGroup } from '../types';
import { TabComponent } from './Tab';
import { TabGroupHeader } from './TabGroupHeader';
import { ICONS } from '../constants';

interface TabBarProps {
  tabs: Tab[];
  tabGroups: TabGroup[];
  activeTabId: string;
  isVertical: boolean;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onContextMenu: (e: React.MouseEvent, tabId: string) => void;
  onToolbarContextMenu: (e: React.MouseEvent) => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onGroupContextMenu?: (e: React.MouseEvent, groupId: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs, tabGroups, activeTabId, isVertical, onSelectTab, onCloseTab, onNewTab, onContextMenu, onToolbarContextMenu, onToggleGroupCollapse, onGroupContextMenu
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const groupedTabs: { [key: string]: Tab[] } = tabs.reduce((acc, tab) => {
    const groupId = tab.groupId || 'ungrouped';
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(tab);
    return acc;
  }, {} as { [key: string]: Tab[] });

  const renderTabs = (tabList: Tab[], groupColor?: string) => {
    return tabList.map(tab => (
      <TabComponent
        key={tab.id}
        tab={tab}
        groupColor={groupColor}
        isActive={tab.id === activeTabId}
        onSelect={onSelectTab}
        onClose={onCloseTab}
        onContextMenu={onContextMenu}
      />
    ));
  };
  
  if (isVertical) {
      return (
        <div className="flex flex-col bg-zinc-900 w-64 h-full p-2 gap-1 overflow-y-auto">
          {tabGroups.map(group => (
            <div key={group.id} className="flex flex-col gap-1">
              <TabGroupHeader group={group} onToggleCollapse={onToggleGroupCollapse} onContextMenu={onGroupContextMenu} />
              {!group.isCollapsed && renderTabs(groupedTabs[group.id] || [], group.color)}
            </div>
          ))}
          {renderTabs(groupedTabs['ungrouped'] || [])}
        </div>
      )
  }

  return (
    <div className="flex items-center bg-zinc-900 h-10 pl-2 pr-1 flex-grow min-w-0">
      <div className="flex items-center h-full gap-px flex-grow min-w-0" ref={scrollRef} onWheel={(e) => {
          if (scrollRef.current) scrollRef.current.scrollLeft += e.deltaY;
      }}>
        {tabGroups.map(group => (
          <div key={group.id} className="flex items-center h-full gap-px p-1 bg-zinc-800/50 rounded-lg">
            <TabGroupHeader group={group} onToggleCollapse={onToggleGroupCollapse} onContextMenu={onGroupContextMenu} />
            {!group.isCollapsed && renderTabs(groupedTabs[group.id] || [], group.color)}
          </div>
        ))}
        {renderTabs(groupedTabs['ungrouped'] || [])}
      </div>
      <div
        className="flex-grow h-full"
        onContextMenu={onToolbarContextMenu}
      ></div>
      <button onClick={onNewTab} className="ml-1 p-1.5 rounded-full hover:bg-zinc-700 transition-colors flex-shrink-0">
        {ICONS.ADD}
      </button>
    </div>
  );
};
