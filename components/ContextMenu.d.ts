import React from 'react';
import type { ContextMenuAction } from '../types';
interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    actions: ContextMenuAction[];
}
export declare const ContextMenu: React.FC<ContextMenuProps>;
export {};
//# sourceMappingURL=ContextMenu.d.ts.map