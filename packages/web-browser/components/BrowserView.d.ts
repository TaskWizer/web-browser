import React from 'react';
import type { Tab } from '../types';
interface BrowserViewProps {
    activeTab: Tab | undefined;
    onSearch: (query: string) => void;
    onNavigate: (url: string) => void;
}
export declare const BrowserView: React.FC<BrowserViewProps>;
export {};
//# sourceMappingURL=BrowserView.d.ts.map