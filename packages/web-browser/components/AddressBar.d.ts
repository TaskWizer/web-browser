import React from 'react';
import type { Tab } from '../types';
interface AddressBarProps {
    activeTab: Tab | undefined;
    isBookmarked: boolean;
    onNavigate: (url: string, options?: {
        newTab?: boolean;
    }) => void;
    onSearch: (query: string) => void;
    onBack: () => void;
    onForward: () => void;
    onReload: () => void;
    onToggleBookmark: () => void;
    onToggleVerticalTabs: () => void;
}
export declare const AddressBar: React.FC<AddressBarProps>;
export {};
//# sourceMappingURL=AddressBar.d.ts.map