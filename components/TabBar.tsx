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
        <div className="flex flex-col w-64 h-full border-r bg-browser-surface border-browser-border">
          {/* Scrollable tabs area */}
          <div className="flex-grow overflow-y-auto p-2 gap-1 flex flex-col custom-scrollbar">
            {tabGroups.map(group => (
              <div key={group.id} className="flex flex-col gap-1">
                <TabGroupHeader group={group} onToggleCollapse={onToggleGroupCollapse} onContextMenu={onGroupContextMenu} />
                {!group.isCollapsed && renderTabs(groupedTabs[group.id] || [], group.color)}
              </div>
            ))}
            {renderTabs(groupedTabs['ungrouped'] || [])}
          </div>

          {/* Bottom controls: New Tab button and Window Controls */}
          <div className="flex-shrink-0 p-2 border-t flex flex-col gap-2" style={{borderColor: '#2a2a3e'}}>
            <button
              onClick={onNewTab}
              className="browser-button w-full flex items-center justify-center gap-2"
            >
              {ICONS.ADD}
              <span className="text-sm">New Tab</span>
            </button>

            {/* Window Controls */}
            <div className="flex items-center justify-center gap-2">
              <button className="browser-button p-1.5 rounded-full">
                {ICONS.WINDOW_MINIMIZE}
              </button>
              <button className="browser-button p-1.5 rounded-full">
                {ICONS.WINDOW_MAXIMIZE}
              </button>
              <button className="p-1.5 text-white bg-red-600/80 hover:bg-red-500 rounded-full transition-colors">
                {ICONS.WINDOW_CLOSE}
              </button>
            </div>
          </div>
        </div>
      )
  }

  return (
    <div className="flex items-center h-10 pl-2 pr-1 flex-grow min-w-0 bg-browser-surface">
      <div className="flex items-center h-full gap-px flex-grow min-w-0" ref={scrollRef} onWheel={(e) => {
          if (scrollRef.current) scrollRef.current.scrollLeft += e.deltaY;
      }}>
        {tabGroups.map(group => (
          <div key={group.id} className="flex items-center h-full gap-px p-1 bg-browser-bg/50 rounded-lg border border-browser-border">
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
      <button onClick={onNewTab} className="browser-button ml-1 p-1.5 rounded-full flex-shrink-0">
        {ICONS.ADD}
      </button>
    </div>
  );
};
