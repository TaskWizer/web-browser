// FIX: Define shared types for the application to resolve module errors.
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

export interface GeminiSearchResult {
  query: string;
  answer: string;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  iconUrl?: string;
}

export interface ContextMenuAction {
  label: string;
  action?: () => void;
  subActions?: Omit<ContextMenuAction, 'subActions'>[];
  disabled?: boolean;
}
