export interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  isSecure: boolean;
  screenshotUrl?: string | null;
  geminiSearchResult?: GeminiSearchResult | null;
  groupId?: string | null;
  history: string[];
  historyIndex: number;
}

export interface TabGroup {
  id: string;
  name: string;
  color: string;
  isCollapsed: boolean;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  folder?: string;
}

export interface ContextMenuAction {
  label: string;
  action: () => void;
  disabled?: boolean;
  subActions?: ContextMenuAction[];
}

export interface GeminiSearchResult {
  query: string;
  answer: string;
  isStreaming: boolean;
  conversationHistory?: ConversationMessage[];
  suggestedPrompts?: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface WebBrowserConfig {
  enableApi?: boolean;
  apiBasePath?: string;
  standalone?: boolean;
  defaultUrl?: string;
  enablePdf?: boolean;
  enableEpub?: boolean;
  maxFileSize?: number;
}

export type BrowserMode = 'library' | 'standalone' | 'spa';
export type ViewMode = 'default' | 'sandboxed' | 'legacy';
export type ThemeMode = 'light' | 'dark' | 'auto';