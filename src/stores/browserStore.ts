import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Tab, TabGroup, Bookmark, ContextMenuAction } from '../types'
import { generateId } from '../utils/idGenerator'

interface BrowserState {
  // Tab Management
  tabs: Tab[]
  activeTabId: string | null
  tabGroups: TabGroup[]

  // UI State
  showBookmarkBar: boolean
  isVerticalTabs: boolean

  // Bookmarks
  bookmarks: Bookmark[]

  // Context Menu
  contextMenu: { x: number; y: number; actions: ContextMenuAction[] } | null

  // Navigation History
  closedTabs: Tab[]

  // Settings
  settings: {
    theme: 'dark' | 'light' | 'auto'
    autoBookmark: boolean
    showUrlSuggestions: boolean
    enableGeminiSearch: boolean
    defaultSearchEngine: 'google' | 'bing' | 'duckduckgo' | 'gemini'
  }
}

interface BrowserActions {
  // Tab Actions
  createTab: (url?: string) => string
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTab: (tabId: string, updates: Partial<Tab>) => void
  duplicateTab: (tabId: string) => void
  moveTab: (fromIndex: number, toIndex: number) => void

  // Navigation Actions
  navigateTab: (tabId: string, url: string) => void
  navigateBack: (tabId: string) => void
  navigateForward: (tabId: string) => void
  reloadTab: (tabId: string) => void

  // Tab Group Actions
  createTabGroup: (name: string, color: string) => string
  updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => void
  deleteTabGroup: (groupId: string) => void
  addTabToGroup: (tabId: string, groupId: string) => void
  removeTabFromGroup: (tabId: string) => void
  toggleGroupCollapse: (groupId: string) => void

  // Bookmark Actions
  addBookmark: (bookmark: Omit<Bookmark, 'id'>) => void
  removeBookmark: (bookmarkId: string) => void
  updateBookmark: (bookmarkId: string, updates: Partial<Bookmark>) => void
  toggleBookmarkBar: () => void

  // Context Menu Actions
  showContextMenu: (x: number, y: number, actions: ContextMenuAction[]) => void
  hideContextMenu: () => void

  // Settings Actions
  updateSettings: (updates: Partial<BrowserState['settings']>) => void

  // Utility Actions
  restoreClosedTab: () => void
  clearClosedTabs: () => void
  exportData: () => string
  importData: (data: string) => boolean

  // Bulk Actions
  closeAllTabs: () => void
  closeOtherTabs: (exceptTabId: string) => void
  closeTabsToRight: (tabId: string) => void
}

// Utility function to generate unique IDs
function generateId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper to create a new tab
function createNewTab(url?: string): Tab {
  return {
    id: generateId(),
    url: url || 'about:blank',
    title: url ? new URL(url).hostname : 'New Tab',
    isLoading: !!url && url !== 'about:blank',
    isSecure: url?.startsWith('https') ?? false,
    history: url ? [url] : [],
    historyIndex: 0,
    groupId: undefined,
    createdAt: Date.now(),
    lastAccessed: Date.now(),
  }
}

export const useBrowserStore = create<BrowserState & BrowserActions>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial State
        tabs: [],
        activeTabId: null,
        tabGroups: [],
        showBookmarkBar: true,
        isVerticalTabs: false,
        bookmarks: [
          { id: 'b0', title: 'Google', url: 'https://www.google.com' },
          { id: 'b1', title: 'Chat', url: 'https://chat.cyopsys.com/' },
          { id: 'b2', title: 'Build', url: 'https://build.cyopsys.com/' },
        ],
        contextMenu: null,
        closedTabs: [],
        settings: {
          theme: 'dark',
          autoBookmark: false,
          showUrlSuggestions: true,
          enableGeminiSearch: true,
          defaultSearchEngine: 'google',
        },

        // Tab Actions
        createTab: (url) => {
          set((state) => {
            const newTab = createNewTab(url)
            state.tabs.push(newTab)
            state.activeTabId = newTab.id
            return newTab.id
          })
        },

        closeTab: (tabId) => {
          set((state) => {
            const tabIndex = state.tabs.findIndex(t => t.id === tabId)
            if (tabIndex === -1) return

            const tab = state.tabs[tabIndex]

            // Add to closed tabs for potential restoration
            state.closedTabs.unshift(tab)
            if (state.closedTabs.length > 20) {
              state.closedTabs = state.closedTabs.slice(0, 20)
            }

            // Remove the tab
            state.tabs.splice(tabIndex, 1)

            // Handle active tab selection
            if (state.activeTabId === tabId) {
              if (state.tabs.length > 0) {
                // Activate the tab to the right, or the last tab if closing the rightmost
                const newActiveIndex = Math.min(tabIndex, state.tabs.length - 1)
                state.activeTabId = state.tabs[newActiveIndex]?.id || null
              } else {
                // No tabs left, create a new one
                const newTab = createNewTab()
                state.tabs.push(newTab)
                state.activeTabId = newTab.id
              }
            }
          })
        },

        setActiveTab: (tabId) => {
          set((state) => {
            const tab = state.tabs.find(t => t.id === tabId)
            if (tab) {
              state.activeTabId = tabId
              tab.lastAccessed = Date.now()
            }
          })
        },

        updateTab: (tabId, updates) => {
          set((state) => {
            const tab = state.tabs.find(t => t.id === tabId)
            if (tab) {
              Object.assign(tab, updates)
              tab.lastAccessed = Date.now()
            }
          })
        },

        duplicateTab: (tabId) => {
          set((state) => {
            const originalTab = state.tabs.find(t => t.id === tabId)
            if (!originalTab) return

            const duplicatedTab: Tab = {
              ...originalTab,
              id: generateId(),
              history: [...originalTab.history],
              historyIndex: originalTab.historyIndex,
              createdAt: Date.now(),
              lastAccessed: Date.now(),
            }

            const originalIndex = state.tabs.findIndex(t => t.id === tabId)
            state.tabs.splice(originalIndex + 1, 0, duplicatedTab)
            state.activeTabId = duplicatedTab.id
          })
        },

        moveTab: (fromIndex, toIndex) => {
          set((state) => {
            if (fromIndex < 0 || fromIndex >= state.tabs.length ||
                toIndex < 0 || toIndex >= state.tabs.length) return

            const [movedTab] = state.tabs.splice(fromIndex, 1)
            state.tabs.splice(toIndex, 0, movedTab)
          })
        },

        // Navigation Actions
        navigateTab: (tabId, url) => {
          set((state) => {
            const tab = state.tabs.find(t => t.id === tabId)
            if (!tab) return

            const newHistory = tab.history.slice(0, tab.historyIndex + 1)
            newHistory.push(url)

            Object.assign(tab, {
              url,
              history: newHistory,
              historyIndex: newHistory.length - 1,
              isLoading: true,
              lastAccessed: Date.now(),
              title: new URL(url).hostname,
            })
          })
        },

        navigateBack: (tabId) => {
          set((state) => {
            const tab = state.tabs.find(t => t.id === tabId)
            if (!tab || tab.historyIndex === 0) return

            tab.historyIndex -= 1
            tab.url = tab.history[tab.historyIndex]
            tab.isLoading = true
            tab.lastAccessed = Date.now()
          })
        },

        navigateForward: (tabId) => {
          set((state) => {
            const tab = state.tabs.find(t => t.id === tabId)
            if (!tab || tab.historyIndex >= tab.history.length - 1) return

            tab.historyIndex += 1
            tab.url = tab.history[tab.historyIndex]
            tab.isLoading = true
            tab.lastAccessed = Date.now()
          })
        },

        reloadTab: (tabId) => {
          set((state) => {
            const tab = state.tabs.find(t => t.id === tabId)
            if (!tab) return

            tab.isLoading = true
            tab.lastAccessed = Date.now()
          })
        },

        // Tab Group Actions
        createTabGroup: (name, color) => {
          set((state) => {
            const groupId = generateId()
            state.tabGroups.push({
              id: groupId,
              name,
              color,
              isCollapsed: false,
              createdAt: Date.now(),
            })
            return groupId
          })
        },

        updateTabGroup: (groupId, updates) => {
          set((state) => {
            const group = state.tabGroups.find(g => g.id === groupId)
            if (group) {
              Object.assign(group, updates)
            }
          })
        },

        deleteTabGroup: (groupId) => {
          set((state) => {
            // Remove tabs from the group
            state.tabs.forEach(tab => {
              if (tab.groupId === groupId) {
                tab.groupId = undefined
              }
            })
            // Remove the group
            state.tabGroups = state.tabGroups.filter(g => g.id !== groupId)
          })
        },

        addTabToGroup: (tabId, groupId) => {
          set((state) => {
            const tab = state.tabs.find(t => t.id === tabId)
            const group = state.tabGroups.find(g => g.id === groupId)
            if (tab && group) {
              tab.groupId = groupId
            }
          })
        },

        removeTabFromGroup: (tabId) => {
          set((state) => {
            const tab = state.tabs.find(t => t.id === tabId)
            if (tab) {
              tab.groupId = undefined
            }
          })
        },

        toggleGroupCollapse: (groupId) => {
          set((state) => {
            const group = state.tabGroups.find(g => g.id === groupId)
            if (group) {
              group.isCollapsed = !group.isCollapsed
            }
          })
        },

        // Bookmark Actions
        addBookmark: (bookmark) => {
          set((state) => {
            // Check for duplicates
            if (!state.bookmarks.some(b => b.url === bookmark.url)) {
              state.bookmarks.push({
                ...bookmark,
                id: generateId(),
                createdAt: Date.now(),
              })
            }
          })
        },

        removeBookmark: (bookmarkId) => {
          set((state) => {
            state.bookmarks = state.bookmarks.filter(b => b.id !== bookmarkId)
          })
        },

        updateBookmark: (bookmarkId, updates) => {
          set((state) => {
            const bookmark = state.bookmarks.find(b => b.id === bookmarkId)
            if (bookmark) {
              Object.assign(bookmark, updates)
            }
          })
        },

        toggleBookmarkBar: () => {
          set((state) => {
            state.showBookmarkBar = !state.showBookmarkBar
          })
        },

        // Context Menu Actions
        showContextMenu: (x, y, actions) => {
          set((state) => {
            state.contextMenu = { x, y, actions }
          })
        },

        hideContextMenu: () => {
          set((state) => {
            state.contextMenu = null
          })
        },

        // Settings Actions
        updateSettings: (updates) => {
          set((state) => {
            Object.assign(state.settings, updates)
          })
        },

        // Utility Actions
        restoreClosedTab: () => {
          set((state) => {
            if (state.closedTabs.length === 0) return

            const tabToRestore = state.closedTabs.shift()
            if (tabToRestore) {
              const restoredTab: Tab = {
                ...tabToRestore,
                id: generateId(),
                createdAt: Date.now(),
                lastAccessed: Date.now(),
              }
              state.tabs.push(restoredTab)
              state.activeTabId = restoredTab.id
            }
          })
        },

        clearClosedTabs: () => {
          set((state) => {
            state.closedTabs = []
          })
        },

        exportData: () => {
          const state = get()
          return JSON.stringify({
            tabs: state.tabs,
            tabGroups: state.tabGroups,
            bookmarks: state.bookmarks,
            settings: state.settings,
            version: '1.0.0',
            exportedAt: Date.now(),
          }, null, 2)
        },

        importData: (data) => {
          try {
            const imported = JSON.parse(data)
            if (!imported.tabs || !Array.isArray(imported.tabs)) {
              return false
            }

            set((state) => {
              // Validate and merge imported data
              state.tabs = imported.tabs.map((tab: any) => ({
                ...createNewTab(),
                ...tab,
                id: tab.id || generateId(),
              }))

              if (imported.tabGroups && Array.isArray(imported.tabGroups)) {
                state.tabGroups = imported.tabGroups
              }

              if (imported.bookmarks && Array.isArray(imported.bookmarks)) {
                state.bookmarks = imported.bookmarks
              }

              if (imported.settings) {
                Object.assign(state.settings, imported.settings)
              }

              // Set first tab as active
              if (state.tabs.length > 0) {
                state.activeTabId = state.tabs[0].id
              }
            })

            return true
          } catch (error) {
            console.error('Failed to import data:', error)
            return false
          }
        },

        // Bulk Actions
        closeAllTabs: () => {
          set((state) => {
            if (state.tabs.length === 0) return

            // Move all tabs to closed tabs
            state.closedTabs.unshift(...state.tabs)
            if (state.closedTabs.length > 20) {
              state.closedTabs = state.closedTabs.slice(0, 20)
            }

            // Create a new tab
            const newTab = createNewTab()
            state.tabs = [newTab]
            state.activeTabId = newTab.id
          })
        },

        closeOtherTabs: (exceptTabId) => {
          set((state) => {
            const tabsToClose = state.tabs.filter(t => t.id !== exceptTabId)

            // Move closed tabs to history
            state.closedTabs.unshift(...tabsToClose)
            if (state.closedTabs.length > 20) {
              state.closedTabs = state.closedTabs.slice(0, 20)
            }

            // Keep only the specified tab
            state.tabs = state.tabs.filter(t => t.id === exceptTabId)
            state.activeTabId = exceptTabId
          })
        },

        closeTabsToRight: (tabId) => {
          set((state) => {
            const tabIndex = state.tabs.findIndex(t => t.id === tabId)
            if (tabIndex === -1) return

            const tabsToClose = state.tabs.slice(tabIndex + 1)

            // Move closed tabs to history
            state.closedTabs.unshift(...tabsToClose)
            if (state.closedTabs.length > 20) {
              state.closedTabs = state.closedTabs.slice(0, 20)
            }

            // Keep tabs up to and including the specified tab
            state.tabs = state.tabs.slice(0, tabIndex + 1)
          })
        },
      })),
      {
        name: 'browser-store-v1',
        partialize: (state) => ({
          tabs: state.tabs,
          activeTabId: state.activeTabId,
          tabGroups: state.tabGroups,
          showBookmarkBar: state.showBookmarkBar,
          isVerticalTabs: state.isVerticalTabs,
          bookmarks: state.bookmarks,
          settings: state.settings,
        }),
        version: 1,
      }
    )
  )
)

// Selectors for derived state
export const useActiveTab = () => useBrowserStore(state =>
  state.tabs.find(tab => tab.id === state.activeTabId)
)

export const useTabCount = () => useBrowserStore(state => state.tabs.length)

export const useBookmarkCount = () => useBrowserStore(state => state.bookmarks.length)

export const useIsTabBookmarked = () => useBrowserStore(state => {
  const activeTab = state.tabs.find(tab => tab.id === state.activeTabId)
  return activeTab ? state.bookmarks.some(b => b.url === activeTab.url) : false
})

export const useTabGroupsById = () => useBrowserStore(state => {
  const groups: Record<string, TabGroup> = {}
  state.tabGroups.forEach(group => {
    groups[group.id] = group
  })
  return groups
})

export const useTabsByGroup = () => useBrowserStore(state => {
  const grouped: Record<string, Tab[]> = { ungrouped: [] }

  state.tabs.forEach(tab => {
    const groupId = tab.groupId || 'ungrouped'
    if (!grouped[groupId]) {
      grouped[groupId] = []
    }
    grouped[groupId].push(tab)
  })

  return grouped
})