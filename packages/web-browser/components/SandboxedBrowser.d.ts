import React from 'react';
interface SandboxedBrowserProps {
    url: string;
    title?: string;
}
/**
 * SandboxedBrowser Component
 *
 * Renders external web content within a sandboxed iframe, bypassing CORS restrictions.
 *
 * Features:
 * - CORS bypass using proxy service
 * - Sandboxed iframe for security isolation
 * - Automatic fallback to simple iframe if advanced rendering fails
 * - Loading states and error handling
 */
export declare const SandboxedBrowser: React.FC<SandboxedBrowserProps>;
export {};
//# sourceMappingURL=SandboxedBrowser.d.ts.map