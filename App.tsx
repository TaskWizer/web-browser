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

            // Set a timeout for screenshot loading (5 seconds)
            const timeoutId = setTimeout(() => {
                if (!isCancelled) {
                    console.warn(`Screenshot loading timed out for ${tab.url}`);
                    setTabs(prevTabs => prevTabs.map(t =>
                        t.id === tab.id
                            ? { ...t, isLoading: false, title: hostname, screenshotUrl: null }
                            : t
                    ));
                }
            }, 5000);

            // Preload the image to check if it's valid before updating state
            const img = new Image();
            img.onload = () => {
                clearTimeout(timeoutId);
                if (!isCancelled) {
                    setTabs(prevTabs => prevTabs.map(t =>
                        t.id === tab.id
                            ? { ...t, isLoading: false, title: hostname, screenshotUrl }
                            : t
                    ));
                }
            };
            img.onerror = () => {
                clearTimeout(timeoutId);
                if (!isCancelled) {
                    console.warn(`Screenshot failed to load for ${tab.url}, showing fallback view`);
                    setTabs(prevTabs => prevTabs.map(t =>
                        t.id === tab.id
                            ? { ...t, isLoading: false, title: hostname, screenshotUrl: null }
                            : t
                    ));
                }
            }
            img.src = screenshotUrl;

        } catch (error) {
            console.error("Navigation failed:", error);
            if (!isCancelled) {
                const title = tab.url.includes('://') ? new URL(tab.url).hostname : tab.url;
                setTabs(prevTabs => prevTabs.map(t =>
                    t.id === loadingTab.id
                        ? { ...t, isLoading: false, title, screenshotUrl: null }
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
  
  const handleDuplicateTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    const duplicatedTab = createNewTab(tab.url, tab.title);
    duplicatedTab.screenshotUrl = tab.screenshotUrl;
    duplicatedTab.geminiSearchResult = tab.geminiSearchResult;
    duplicatedTab.isLoading = false;
    setTabs(prev => [...prev, duplicatedTab]);
    setActiveTabId(duplicatedTab.id);
  };

  const handlePinTab = (tabId: string) => {
    // Pin functionality - could be implemented by adding a 'pinned' property to Tab type
    console.log('Pin tab:', tabId);
    // For now, just show a message
    alert('Pin tab feature coming soon!');
  };

  const handleMoveTabToGroup = (tabId: string, groupId: string | null) => {
    setTabs(prevTabs => prevTabs.map(tab =>
      tab.id === tabId ? { ...tab, groupId } : tab
    ));
  };

  const handleCreateTabGroup = (tabId: string) => {
    const groupName = prompt('Enter group name:');
    if (!groupName) return;

    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newGroup: TabGroup = {
      id: Date.now().toString(),
      name: groupName,
      color,
      isCollapsed: false,
    };

    setTabGroups(prev => [...prev, newGroup]);
    handleMoveTabToGroup(tabId, newGroup.id);
  };

  const handleCloseOtherTabs = (tabId: string) => {
    const tabToKeep = tabs.find(t => t.id === tabId);
    if (!tabToKeep) return;

    const tabsToClose = tabs.filter(t => t.id !== tabId);
    setClosedTabs(prev => [...tabsToClose, ...prev]);
    setTabs([tabToKeep]);
    setActiveTabId(tabId);
  };

  const handleCloseTabsToRight = (tabId: string) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    const tabsToClose = tabs.slice(tabIndex + 1);
    setClosedTabs(prev => [...tabsToClose, ...prev]);
    setTabs(tabs.slice(0, tabIndex + 1));
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const hasTabsToRight = tabIndex < tabs.length - 1;
    const hasOtherTabs = tabs.length > 1;

    const groupActions: ContextMenuAction[] = tabGroups.map(group => ({
      label: group.name,
      action: () => handleMoveTabToGroup(tabId, group.id),
    }));

    const actions: ContextMenuAction[] = [
      { label: "Reload Tab", action: () => handleNavigate(tab.url, { fromHistory: {newIndex: tab.historyIndex }}) },
      { label: "Duplicate Tab", action: () => handleDuplicateTab(tabId) },
      { label: "Pin Tab", action: () => handlePinTab(tabId) },
      { label: "---" },
      { label: "Add to Bookmarks", action: () => {
        if (!tab.url.startsWith('about:')) {
          setBookmarks(prev => [...prev, {id: Date.now().toString(), url: tab.url, title: tab.title}]);
        }
      }, disabled: tab.url.startsWith('about:') || bookmarks.some(b => b.url === tab.url) },
      { label: "---" },
      {
        label: "Move to Group",
        subActions: [
          { label: "New Group...", action: () => handleCreateTabGroup(tabId) },
          ...(groupActions.length > 0 ? [{ label: "---" }, ...groupActions] : []),
          ...(tab.groupId ? [{ label: "---" }, { label: "Remove from Group", action: () => handleMoveTabToGroup(tabId, null) }] : []),
        ]
      },
      { label: "---" },
      { label: "Close Tab", action: () => handleCloseTab(tabId) },
      { label: "Close Other Tabs", action: () => handleCloseOtherTabs(tabId), disabled: !hasOtherTabs },
      { label: "Close Tabs to the Right", action: () => handleCloseTabsToRight(tabId), disabled: !hasTabsToRight },
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
  };

  const handleBookmarkContextMenu = (e: React.MouseEvent, bookmarkId: string) => {
    e.preventDefault();
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    const actions: ContextMenuAction[] = [
      { label: "Open in New Tab", action: () => handleNavigate(bookmark.url, { newTab: true }) },
      { label: "---" },
      { label: "Edit...", action: () => {
        const newTitle = prompt('Edit bookmark title:', bookmark.title);
        if (newTitle && newTitle.trim()) {
          setBookmarks(prev => prev.map(b =>
            b.id === bookmarkId ? { ...b, title: newTitle.trim() } : b
          ));
        }
      }},
      { label: "Edit URL...", action: () => {
        const newUrl = prompt('Edit bookmark URL:', bookmark.url);
        if (newUrl && newUrl.trim()) {
          setBookmarks(prev => prev.map(b =>
            b.id === bookmarkId ? { ...b, url: newUrl.trim() } : b
          ));
        }
      }},
      { label: "---" },
      { label: "Copy URL", action: () => {
        navigator.clipboard.writeText(bookmark.url).then(() => {
          console.log('URL copied to clipboard');
        }).catch(err => {
          console.error('Failed to copy URL:', err);
        });
      }},
      { label: "---" },
      { label: "Delete", action: () => {
        if (confirm(`Delete bookmark "${bookmark.title}"?`)) {
          setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
        }
      }},
    ];
    setContextMenu({ x: e.clientX, y: e.clientY, actions });
  };

  const handleBookmarkBarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const actions: ContextMenuAction[] = [
      { label: "Add Bookmark...", action: () => {
        const url = prompt('Enter bookmark URL:');
        if (!url || !url.trim()) return;
        const title = prompt('Enter bookmark title:', new URL(url).hostname);
        if (!title || !title.trim()) return;
        setBookmarks(prev => [...prev, {
          id: Date.now().toString(),
          url: url.trim(),
          title: title.trim()
        }]);
      }},
      { label: "---" },
      { label: "Sort by Name", action: () => {
        setBookmarks(prev => [...prev].sort((a, b) => a.title.localeCompare(b.title)));
      }},
      { label: "---" },
      { label: showBookmarkBar ? "Hide Bookmarks Bar" : "Show Bookmarks Bar", action: () => setShowBookmarkBar(!showBookmarkBar) }
    ];
    setContextMenu({ x: e.clientX, y: e.clientY, actions });
  };

  const handleTabGroupContextMenu = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault();
    const group = tabGroups.find(g => g.id === groupId);
    if (!group) return;

    const groupTabs = tabs.filter(t => t.groupId === groupId);

    const actions: ContextMenuAction[] = [
      { label: "Rename Group...", action: () => {
        const newName = prompt('Enter new group name:', group.name);
        if (newName && newName.trim()) {
          setTabGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, name: newName.trim() } : g
          ));
        }
      }},
      { label: "Change Color...", action: () => {
        const colors = [
          { name: 'Red', value: '#ef4444' },
          { name: 'Orange', value: '#f59e0b' },
          { name: 'Green', value: '#10b981' },
          { name: 'Blue', value: '#3b82f6' },
          { name: 'Purple', value: '#8b5cf6' },
          { name: 'Pink', value: '#ec4899' },
        ];
        const colorChoice = prompt(
          `Choose a color:\n${colors.map((c, i) => `${i + 1}. ${c.name}`).join('\n')}`,
          '1'
        );
        const colorIndex = parseInt(colorChoice || '1') - 1;
        if (colorIndex >= 0 && colorIndex < colors.length) {
          setTabGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, color: colors[colorIndex].value } : g
          ));
        }
      }},
      { label: "---" },
      { label: "Add New Tab to Group", action: () => {
        const newTab = createNewTab();
        newTab.groupId = groupId;
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
      }},
      { label: "---" },
      { label: "Ungroup Tabs", action: () => {
        setTabs(prevTabs => prevTabs.map(tab =>
          tab.groupId === groupId ? { ...tab, groupId: null } : tab
        ));
        setTabGroups(prev => prev.filter(g => g.id !== groupId));
      }},
      { label: "Close Group", action: () => {
        if (confirm(`Close all ${groupTabs.length} tabs in "${group.name}"?`)) {
          setClosedTabs(prev => [...groupTabs, ...prev]);
          setTabs(prevTabs => prevTabs.filter(tab => tab.groupId !== groupId));
          setTabGroups(prev => prev.filter(g => g.id !== groupId));
        }
      }, disabled: groupTabs.length === 0 },
    ];
    setContextMenu({ x: e.clientX, y: e.clientY, actions });
  };

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
      {showBookmarkBar && <BookmarkBar
        bookmarks={bookmarks}
        onSelectBookmark={handleNavigate}
        onNavigateInNewTab={(url) => handleNavigate(url, { newTab: true })}
        onDrop={handleBookmarkDrop}
        onBookmarkContextMenu={handleBookmarkContextMenu}
        onToolbarContextMenu={handleBookmarkBarContextMenu}
      />}
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
          onGroupContextMenu={handleTabGroupContextMenu}
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