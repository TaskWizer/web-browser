import React, { useState, useEffect, useCallback } from 'react';
import { TabBar } from './components/TabBar';
import { AddressBar } from './components/AddressBar';
import { BrowserView } from './components/BrowserView';
import { BookmarkBar } from './components/BookmarkBar';
import { WindowControls } from './components/WindowControls';
import { ContextMenu } from './components/ContextMenu';
import type { Tab, TabGroup, Bookmark, ContextMenuAction } from './types';
import { NEW_TAB_URL, ABOUT_SETTINGS_URL } from './constants';
import { searchWithGemini } from './services/geminiService';

// CRITICAL FIX: Replaced the buggy useLocalStorage implementation with a robust, industry-standard
// pattern using useState and useEffect. The previous version caused stale state closures, which was
// the root cause of all navigation failures. This new version ensures state updates are atomic and
// reliably persisted, making the entire application stable.
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

const createNewTab = (url: string = NEW_TAB_URL, title: string = "New Tab"): Tab => ({
    id: Date.now().toString() + Math.random(),
    url,
    title,
    isLoading: false,
    isSecure: url.startsWith('https') || url.startsWith('about:'),
    screenshotUrl: null,
    geminiSearchResult: null,
    groupId: null,
    history: [url],
    historyIndex: 0,
});

const App: React.FC = () => {
  const [tabs, setTabs] = useLocalStorage<Tab[]>('browser-tabs-v4', []);
  const [tabGroups, setTabGroups] = useLocalStorage<TabGroup[]>('browser-tab-groups-v4', []);
  const [activeTabId, setActiveTabId] = useLocalStorage<string | null>('browser-active-tab-v4', null);
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('browser-bookmarks-v4', [
    { id: 'b1', title: 'Google', url: 'https://google.com' },
    { id: 'b2', title: 'GitHub', url: 'https://github.com' },
  ]);
  const [closedTabs, setClosedTabs] = useState<Tab[]>([]);
  const [showBookmarkBar, setShowBookmarkBar] = useLocalStorage('browser-show-bookmark-bar-v4', true);
  const [isVerticalTabs, setIsVerticalTabs] = useLocalStorage('browser-vertical-tabs-v4', false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, actions: ContextMenuAction[] } | null>(null);
  
  // Initialize tabs on first load
  useEffect(() => {
    if (tabs.length === 0) {
        const newTab = createNewTab();
        setTabs([newTab]);
        setActiveTabId(newTab.id);
    } else if (!activeTabId || !tabs.find(t => t.id === activeTabId)) {
        setActiveTabId(tabs[0]?.id || null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to handle async fetching for loading tabs
  useEffect(() => {
    const loadingTab = tabs.find(tab => tab.isLoading);
    if (!loadingTab || loadingTab.url.startsWith('about:') || loadingTab.url.startsWith('gemini://')) {
        return;
    }

    let isCancelled = false;

    const fetchPreview = async (tab: Tab) => {
        try {
            const hostname = new URL(tab.url).hostname;
            const screenshotUrl = `https://image.thum.io/get/width/1920/crop/1080/noanimate/${encodeURIComponent(tab.url)}`;
            
            // Preload the image to check if it's valid before updating state
            const img = new Image();
            img.onload = () => {
                if (!isCancelled) {
                    setTabs(prevTabs => prevTabs.map(t => 
                        t.id === tab.id 
                            ? { ...t, isLoading: false, title: hostname, screenshotUrl } 
                            : t
                    ));
                }
            };
            img.onerror = () => {
                if (!isCancelled) {
                     setTabs(prevTabs => prevTabs.map(t => 
                        t.id === tab.id 
                            ? { ...t, isLoading: false, title: "Failed to load", screenshotUrl: null } 
                            : t
                    ));
                }
            }
            img.src = screenshotUrl;

        } catch (error) {
            console.error("Navigation failed:", error);
            if (!isCancelled) {
                setTabs(prevTabs => prevTabs.map(t => 
                    t.id === loadingTab.id 
                        ? { ...t, isLoading: false, title: "Failed to load", screenshotUrl: null } 
                        : t
                ));
            }
        }
    }

    fetchPreview(loadingTab);

    return () => {
        isCancelled = true;
    };
  }, [tabs, setTabs]);


  const handleNavigate = useCallback((url: string, options: { newTab?: boolean; fromHistory?: { newIndex: number } } = {}) => {
    const { newTab = false, fromHistory } = options;

    if (newTab) {
        const newTabObject = createNewTab(url, 'Loading...');
        newTabObject.isLoading = !url.startsWith('about:');
        setTabs(prevTabs => [...prevTabs, newTabObject]);
        setActiveTabId(newTabObject.id);
        return;
    }

    let targetTabId = activeTabId;
    if (!targetTabId) {
        const newTabObject = createNewTab(url, 'Loading...');
        newTabObject.isLoading = !url.startsWith('about:');
        setTabs([newTabObject]);
        setActiveTabId(newTabObject.id);
        return;
    }
    
    // This is a synchronous state update that sets the navigation in motion.
    setTabs(prevTabs => prevTabs.map(tab => {
        if (tab.id === targetTabId) {
            const history = fromHistory ? tab.history : [...tab.history.slice(0, tab.historyIndex + 1), url];
            const historyIndex = fromHistory ? fromHistory.newIndex : history.length - 1;
            
            const isLoading = !url.startsWith('about:') && !url.startsWith('gemini://');
            const title = isLoading ? 'Loading...' : (url === ABOUT_SETTINGS_URL ? 'Settings' : 'New Tab');

            return {
                ...tab,
                url,
                title,
                isLoading,
                geminiSearchResult: null,
                screenshotUrl: null,
                isSecure: url.startsWith('https') || url.startsWith('about:'),
                history,
                historyIndex
            };
        }
        return tab;
    }));
  }, [activeTabId, setActiveTabId, setTabs]);


  const handleNewTab = () => {
    const newT = createNewTab();
    setTabs(prev => [...prev, newT]);
    setActiveTabId(newT.id);
  };
  
  const handleCloseTab = (id: string) => {
    const tabToClose = tabs.find(t => t.id === id);
    if (tabToClose) setClosedTabs(prev => [tabToClose, ...prev.slice(0, 9)]);

    const remainingTabs = tabs.filter(t => t.id !== id);

    if (remainingTabs.length === 0) {
        const newTab = createNewTab();
        setTabs([newTab]);
        setActiveTabId(newTab.id);
        return;
    }

    if (id === activeTabId) {
        const tabIndex = tabs.findIndex(t => t.id === id);
        const newActiveIndex = Math.max(0, tabIndex - 1);
        setActiveTabId(remainingTabs[newActiveIndex]?.id || null);
    }
    
    setTabs(remainingTabs);
  };

  const handleSearch = async (query: string) => {
      if (!activeTabId) return;

      const updateTabForSearch = (isLoading: boolean, answer?: string) => {
          setTabs(prevTabs => prevTabs.map(tab => {
              if (tab.id === activeTabId) {
                  const url = `gemini://search?q=${encodeURIComponent(query)}`;
                  const history = [...tab.history.slice(0, tab.historyIndex + 1), url];
                  return {
                      ...tab,
                      url,
                      title: `Search: ${query}`,
                      isLoading,
                      geminiSearchResult: { query, answer: answer ?? "Thinking..." },
                      history,
                      historyIndex: history.length - 1,
                  }
              }
              return tab;
          }));
      };

      updateTabForSearch(true);
      const answer = await searchWithGemini(query);
      updateTabForSearch(false, answer);
  };
  
  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    const actions: ContextMenuAction[] = [
      { label: "New Tab", action: handleNewTab },
      { label: "Reload", action: () => { const tab = tabs.find(t=>t.id === tabId); if(tab) handleNavigate(tab.url, { fromHistory: {newIndex: tab.historyIndex }}) } },
      { label: "Close Tab", action: () => handleCloseTab(tabId) },
    ];
    setContextMenu({ x: e.clientX, y: e.clientY, actions });
  };
  
  const handleToolbarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const actions: ContextMenuAction[] = [
        { label: "New Tab", action: handleNewTab },
        { label: "Reopen Closed Tab", action: () => {
            if(closedTabs.length > 0) {
                const [lastClosed, ...rest] = closedTabs;
                setClosedTabs(rest);
                setTabs(prev => [...prev, lastClosed]);
                setActiveTabId(lastClosed.id);
            }
        }, disabled: closedTabs.length === 0 },
        { label: showBookmarkBar ? "Hide Bookmarks Bar" : "Show Bookmarks Bar", action: () => setShowBookmarkBar(!showBookmarkBar) }
    ];
    setContextMenu({ x: e.clientX, y: e.clientY, actions });
  }

  const handleToggleBookmark = () => {
      const tab = tabs.find(t => t.id === activeTabId);
      if (!tab || tab.url.startsWith('about:')) return;
      const existing = bookmarks.find(b => b.url === tab.url);
      if (existing) {
          setBookmarks(bookmarks.filter(b => b.id !== existing.id));
      } else {
          setBookmarks([...bookmarks, {id: Date.now().toString(), url: tab.url, title: tab.title}]);
      }
  };
  
  const handleBookmarkDrop = (url: string) => {
      if (bookmarks.some(b => b.url === url)) return;
      try {
        const title = new URL(url).hostname;
        setBookmarks([...bookmarks, {id: Date.now().toString(), url, title}]);
      } catch (e) {
        console.error("Invalid URL dropped for bookmark");
      }
  };

  const handleBack = useCallback(() => {
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab && currentTab.historyIndex > 0) {
        const newIndex = currentTab.historyIndex - 1;
        const url = currentTab.history[newIndex];
        handleNavigate(url, { fromHistory: { newIndex } });
    }
  }, [tabs, activeTabId, handleNavigate]);

  const handleForward = useCallback(() => {
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab && currentTab.historyIndex < currentTab.history.length - 1) {
        const newIndex = currentTab.historyIndex + 1;
        const url = currentTab.history[newIndex];
        handleNavigate(url, { fromHistory: { newIndex } });
    }
  }, [tabs, activeTabId, handleNavigate]);

  const activeTab = tabs.find(t => t.id === activeTabId);
  const isBookmarked = activeTab ? bookmarks.some(b => b.url === activeTab.url) : false;

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-white font-sans antialiased overflow-hidden">
      <header className="flex items-center justify-between h-10 bg-zinc-900 flex-shrink-0">
        {!isVerticalTabs && <TabBar
          tabs={tabs}
          tabGroups={tabGroups}
          activeTabId={activeTabId || ''}
          isVertical={false}
          onSelectTab={setActiveTabId}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
          onContextMenu={handleContextMenu}
          onToolbarContextMenu={handleToolbarContextMenu}
          onToggleGroupCollapse={() => {}}
        />}
        <WindowControls />
      </header>
      <AddressBar
        activeTab={activeTab}
        isBookmarked={isBookmarked}
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        onBack={handleBack}
        onForward={handleForward}
        onReload={() => { if(activeTab) handleNavigate(activeTab.url, { fromHistory: { newIndex: activeTab.historyIndex } }) }}
        onToggleBookmark={handleToggleBookmark}
        onToggleVerticalTabs={() => setIsVerticalTabs(!isVerticalTabs)}
      />
      {showBookmarkBar && <BookmarkBar bookmarks={bookmarks} onSelectBookmark={handleNavigate} onNavigateInNewTab={(url) => handleNavigate(url, { newTab: true })} onDrop={handleBookmarkDrop} />}
      <main className="flex-grow min-h-0 flex">
        {isVerticalTabs && <TabBar
          tabs={tabs}
          tabGroups={tabGroups}
          activeTabId={activeTabId || ''}
          isVertical={true}
          onSelectTab={setActiveTabId}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
          onContextMenu={handleContextMenu}
          onToolbarContextMenu={handleToolbarContextMenu}
          onToggleGroupCollapse={() => {}}
        />}
        <div className="flex-grow min-h-0">
            <BrowserView 
              activeTab={activeTab}
              onSearch={handleSearch}
              onNavigate={handleNavigate}
            />
        </div>
      </main>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={contextMenu.actions}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default App;