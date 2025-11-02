import React from 'react';
import type { TabGroup } from '../types';
interface TabGroupHeaderProps {
    group: TabGroup;
    onToggleCollapse: (groupId: string) => void;
    onContextMenu?: (e: React.MouseEvent, groupId: string) => void;
}
export declare const TabGroupHeader: React.FC<TabGroupHeaderProps>;
export {};
//# sourceMappingURL=TabGroupHeader.d.ts.map