import React, { useState, useEffect, useRef } from 'react';
import { fetchThroughProxy, canUseDirectIframe, type ProxyResponse } from '../services/proxyService';

interface SandboxedBrowserProps {
  url: string;
  title?: string;
}

type RenderMode = 'loading' | 'advanced' | 'fallback' | 'error';

interface RenderState {
  mode: RenderMode;
  html?: string;
  error?: string;
  proxyUsed?: string;
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
export const SandboxedBrowser: React.FC<SandboxedBrowserProps> = ({ url, title }) => {
  const [renderState, setRenderState] = useState<RenderState>({
    mode: 'loading',
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      // Reset state
      setRenderState({ mode: 'loading' });
      setIframeError(false);

      try {
        console.log(`[SandboxedBrowser] Loading ${url}`);

        // Try to fetch through proxy for advanced rendering
        const proxyResponse: ProxyResponse = await fetchThroughProxy(url);

        if (!mounted) return;

        if (proxyResponse.success && proxyResponse.html) {
          console.log(`[SandboxedBrowser] Successfully loaded content via proxy: ${proxyResponse.proxyUsed}`);
          setRenderState({
            mode: 'advanced',
            html: proxyResponse.html,
            proxyUsed: proxyResponse.proxyUsed,
          });
        } else {
          // Proxy failed, try fallback
          console.warn(`[SandboxedBrowser] Proxy failed: ${proxyResponse.error}`);
          
          // Check if we can use direct iframe
          if (canUseDirectIframe(url)) {
            console.log(`[SandboxedBrowser] Falling back to direct iframe for ${url}`);
            setRenderState({
              mode: 'fallback',
            });
          } else {
            setRenderState({
              mode: 'error',
              error: proxyResponse.error || 'Failed to load content',
            });
          }
        }
      } catch (error) {
        if (!mounted) return;
        
        console.error(`[SandboxedBrowser] Error loading content:`, error);
        setRenderState({
          mode: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    };

    loadContent();

    return () => {
      mounted = false;
    };
  }, [url]);

  // Handle iframe load errors
  const handleIframeError = () => {
    console.warn(`[SandboxedBrowser] Iframe failed to load, showing error state`);
    setIframeError(true);
    setRenderState({
      mode: 'error',
      error: 'Failed to load content in iframe. The website may block embedding.',
    });
  };

  // Render loading state
  if (renderState.mode === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-zinc-400">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading {title || url}...</p>
        <p className="text-sm text-zinc-500 mt-2">Fetching content through secure proxy</p>
      </div>
    );
  }

  // Render error state
  if (renderState.mode === 'error' || iframeError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-300 p-8">
        <div className="max-w-2xl w-full bg-zinc-800/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-zinc-700/50">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Unable to Load Content</h2>
            <p className="text-zinc-400 text-sm mb-4 text-center break-all">{url}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/50">
              <p className="text-sm text-zinc-400 mb-2">Error Details:</p>
              <p className="text-sm text-red-400">{renderState.error || 'Unknown error'}</p>
            </div>

            <p className="text-zinc-300 text-sm leading-relaxed">
              This website cannot be displayed within the browser due to security restrictions or CORS policies. 
              You can still open it in a new tab.
            </p>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all transform hover:scale-105 font-semibold w-full justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in New Tab
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Render advanced mode (proxied content with srcdoc)
  if (renderState.mode === 'advanced' && renderState.html) {
    return (
      <div className="relative w-full h-full bg-zinc-900">
        {/* Render mode indicator */}
        <div className="absolute top-2 right-2 z-10 bg-green-600/90 text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          Advanced Rendering
        </div>

        {/* Sandboxed iframe with proxied content */}
        <iframe
          ref={iframeRef}
          srcDoc={renderState.html}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          className="w-full h-full border-0"
          title={title || url}
          onError={handleIframeError}
          style={{
            backgroundColor: '#ffffff',
          }}
        />

        {/* Info footer */}
        <div className="absolute bottom-2 left-2 right-2 bg-zinc-800/90 backdrop-blur-sm text-zinc-300 text-xs px-4 py-2 rounded-lg shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Content loaded via secure proxy • Sandboxed for your protection</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            Open Original
          </a>
        </div>
      </div>
    );
  }

  // Render fallback mode (direct iframe)
  if (renderState.mode === 'fallback') {
    return (
      <div className="relative w-full h-full bg-zinc-900">
        {/* Render mode indicator */}
        <div className="absolute top-2 right-2 z-10 bg-yellow-600/90 text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
          Fallback Mode
        </div>

        {/* Direct iframe */}
        <iframe
          ref={iframeRef}
          src={url}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          className="w-full h-full border-0"
          title={title || url}
          onError={handleIframeError}
          style={{
            backgroundColor: '#ffffff',
          }}
        />

        {/* Info footer */}
        <div className="absolute bottom-2 left-2 right-2 bg-zinc-800/90 backdrop-blur-sm text-zinc-300 text-xs px-4 py-2 rounded-lg shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Direct iframe mode • Some features may be limited</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            Open Original
          </a>
        </div>
      </div>
    );
  }

  // Should never reach here
  return null;
};

