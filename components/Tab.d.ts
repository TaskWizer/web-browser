import React from 'react';
import type { Tab as TabType } from '../types';
interface TabProps {
    tab: TabType;
    groupColor?: string | null;
    isActive: boolean;
    onSelect: (id: string) => void;
    onClose: (id: string) => void;
    onContextMenu: (e: React.MouseEvent, tabId: string) => void;
}
export declare const TabComponent: React.FC<TabProps>;
export {};
//# sourceMappingURL=Tab.d.ts.map