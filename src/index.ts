// Main entry point for @taskwizer/web-browser package

// Components
export * from '../packages/web-browser/components';

// Services
export * from '../packages/web-browser/services';

// Types
export * from '../packages/web-browser/types';

// Main App component
export { default as WebBrowserApp } from '../packages/web-browser/App';

// Configuration
export interface WebBrowserConfig {
  enableApi?: boolean;
  apiBasePath?: string;
  standalone?: boolean;
  defaultUrl?: string;
  enablePdf?: boolean;
  enableEpub?: boolean;
  maxFileSize?: number;
}

export function createWebBrowserConfig(overrides: Partial<WebBrowserConfig> = {}): WebBrowserConfig {
  return {
    enableApi: false,
    apiBasePath: '/api/web-browser',
    standalone: false,
    defaultUrl: 'https://example.com',
    enablePdf: true,
    enableEpub: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    ...overrides,
  };
}