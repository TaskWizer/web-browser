import React from 'react';
import type { GeminiSearchResult as GeminiSearchResultType } from '../types';
interface GeminiSearchResultProps {
    result: GeminiSearchResultType;
    isStreaming?: boolean;
    onSearch?: (query: string) => void;
}
export declare const GeminiSearchResult: React.FC<GeminiSearchResultProps>;
export {};
//# sourceMappingURL=GeminiSearchResult.d.ts.map