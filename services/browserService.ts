import { fetchThroughProxy } from './proxyService';

export interface BrowserService {
  navigate(url: string): Promise<void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  reload(): Promise<void>;
}

export class BrowserServiceImpl implements BrowserService {
  private currentUrl: string | null = null;
  private history: string[] = [];
  private historyIndex: number = -1;

  async navigate(url: string): Promise<void> {
    try {
      // Validate URL format
      new URL(url);

      // Add to history
      if (this.currentUrl && this.currentUrl !== url) {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(this.currentUrl);
        this.historyIndex = this.history.length - 1;
      }

      this.currentUrl = url;

      // Test if URL is accessible through proxy
      const proxyResponse = await fetchThroughProxy(url);
      if (!proxyResponse.success) {
        throw new Error(`Cannot access ${url}: ${proxyResponse.error}`);
      }

      console.log(`[BrowserService] Successfully navigated to: ${url}`);
    } catch (error) {
      console.error(`[BrowserService] Navigation failed for ${url}:`, error);
      throw error;
    }
  }

  async goBack(): Promise<void> {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const previousUrl = this.history[this.historyIndex];
      await this.navigate(previousUrl);
      console.log(`[BrowserService] Navigated back to: ${previousUrl}`);
    } else {
      console.log('[BrowserService] No previous page in history');
    }
  }

  async goForward(): Promise<void> {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const nextUrl = this.history[this.historyIndex];
      await this.navigate(nextUrl);
      console.log(`[BrowserService] Navigated forward to: ${nextUrl}`);
    } else {
      console.log('[BrowserService] No next page in history');
    }
  }

  async reload(): Promise<void> {
    if (this.currentUrl) {
      await this.navigate(this.currentUrl);
      console.log(`[BrowserService] Reloaded current page: ${this.currentUrl}`);
    } else {
      console.log('[BrowserService] No current page to reload');
    }
  }

  // Helper methods for state management
  getCurrentUrl(): string | null {
    return this.currentUrl;
  }

  canGoBack(): boolean {
    return this.historyIndex > 0;
  }

  canGoForward(): boolean {
    return this.historyIndex < this.history.length - 1;
  }
}