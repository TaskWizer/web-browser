/**
 * Proxy Service for CORS Bypass
 *
 * This service handles fetching external web content through a CORS proxy,
 * allowing us to bypass CORS restrictions and render external websites
 * within our sandboxed browser environment.
 */
export interface ProxyConfig {
    primaryProxy: string;
    fallbackProxies: string[];
    timeout: number;
}
export interface ProxyResponse {
    success: boolean;
    html?: string;
    error?: string;
    proxyUsed?: string;
    renderMode?: 'advanced' | 'fallback' | 'error';
}
/**
 * Fetch website content through CORS proxy
 */
export declare function fetchThroughProxy(url: string, config?: Partial<ProxyConfig>): Promise<ProxyResponse>;
/**
 * Check if a URL is likely to work with direct iframe embedding
 * (i.e., doesn't have X-Frame-Options or CSP restrictions)
 */
export declare function canUseDirectIframe(url: string): boolean;
//# sourceMappingURL=proxyService.d.ts.map