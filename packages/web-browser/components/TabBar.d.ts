import React from 'react';
import type { Tab, TabGroup } from '../types';
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
export declare const TabBar: React.FC<TabBarProps>;
export {};
//# sourceMappingURL=TabBar.d.ts.map