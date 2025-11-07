import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConversationMessage, GeminiSearchResult } from '../types'

interface SearchState {
  // Current search
  currentQuery: string
  isSearching: boolean
  searchResults: GeminiSearchResult | null

  // Search history
  searchHistory: string[]
  maxHistoryItems: number

  // Saved searches
  savedSearches: Array<{
    id: string
    query: string
    timestamp: number
    result?: GeminiSearchResult
  }>

  // Settings
  autoSaveHistory: boolean
  showSuggestions: boolean
  maxSuggestions: number
}

interface SearchActions {
  // Search actions
  setSearchQuery: (query: string) => void
  setIsSearching: (isSearching: boolean) => void
  setSearchResults: (results: GeminiSearchResult | null) => void

  // History management
  addToHistory: (query: string) => void
  removeFromHistory: (query: string) => void
  clearHistory: () => void

  // Saved searches
  saveSearch: (query: string, result?: GeminiSearchResult) => void
  removeSavedSearch: (id: string) => void
  clearSavedSearches: () => void

  // Settings
  updateSettings: (settings: Partial<SearchState>) => void

  // Utility
  getSearchSuggestions: (query: string) => string[]
  exportSearchData: () => string
  importSearchData: (data: string) => boolean
}

export const useSearchStore = create<SearchState & SearchActions>()(
  persist(
    (set, get) => ({
      // Initial State
      currentQuery: '',
      isSearching: false,
      searchResults: null,
      searchHistory: [],
      maxHistoryItems: 50,
      savedSearches: [],
      autoSaveHistory: true,
      showSuggestions: true,
      maxSuggestions: 5,

      // Search actions
      setSearchQuery: (query) => {
        set({ currentQuery: query })
      },

      setIsSearching: (isSearching) => {
        set({ isSearching })
      },

      setSearchResults: (results) => {
        set({ searchResults: results })
      },

      // History management
      addToHistory: (query) => {
        set((state) => {
          if (!query.trim()) return

          const trimmedQuery = query.trim()
          const history = state.searchHistory.filter(item => item !== trimmedQuery)
          history.unshift(trimmedQuery)

          // Limit history size
          if (history.length > state.maxHistoryItems) {
            history.splice(state.maxHistoryItems)
          }

          state.searchHistory = history
        })
      },

      removeFromHistory: (query) => {
        set((state) => {
          state.searchHistory = state.searchHistory.filter(item => item !== query)
        })
      },

      clearHistory: () => {
        set({ searchHistory: [] })
      },

      // Saved searches
      saveSearch: (query, result) => {
        set((state) => {
          const trimmedQuery = query.trim()
          if (!trimmedQuery) return

          // Check for duplicates
          const existingIndex = state.savedSearches.findIndex(
            item => item.query === trimmedQuery
          )

          const searchItem = {
            id: Date.now().toString(),
            query: trimmedQuery,
            timestamp: Date.now(),
            result,
          }

          if (existingIndex >= 0) {
            // Update existing
            state.savedSearches[existingIndex] = searchItem
          } else {
            // Add new
            state.savedSearches.unshift(searchItem)

            // Limit saved searches
            if (state.savedSearches.length > 100) {
              state.savedSearches = state.savedSearches.slice(0, 100)
            }
          }
        })
      },

      removeSavedSearch: (id) => {
        set((state) => {
          state.savedSearches = state.savedSearches.filter(item => item.id !== id)
        })
      },

      clearSavedSearches: () => {
        set({ savedSearches: [] })
      },

      // Settings
      updateSettings: (settings) => {
        set((state) => {
          Object.assign(state, settings)
        })
      },

      // Utility
      getSearchSuggestions: (query) => {
        const state = get()
        if (!state.showSuggestions || !query.trim()) {
          return []
        }

        const trimmedQuery = query.trim().toLowerCase()
        const suggestions = new Set<string>()

        // Add from history
        state.searchHistory
          .filter(item => item.toLowerCase().includes(trimmedQuery))
          .slice(0, state.maxSuggestions)
          .forEach(item => suggestions.add(item))

        // Add from saved searches
        state.savedSearches
          .filter(item => item.query.toLowerCase().includes(trimmedQuery))
          .slice(0, state.maxSuggestions - suggestions.size)
          .forEach(item => suggestions.add(item.query))

        return Array.from(suggestions).slice(0, state.maxSuggestions)
      },

      exportSearchData: () => {
        const state = get()
        return JSON.stringify({
          searchHistory: state.searchHistory,
          savedSearches: state.savedSearches,
          settings: {
            autoSaveHistory: state.autoSaveHistory,
            showSuggestions: state.showSuggestions,
            maxSuggestions: state.maxSuggestions,
          },
          version: '1.0.0',
          exportedAt: Date.now(),
        }, null, 2)
      },

      importSearchData: (data) => {
        try {
          const imported = JSON.parse(data)

          set((state) => {
            if (imported.searchHistory && Array.isArray(imported.searchHistory)) {
              state.searchHistory = imported.searchHistory.slice(0, state.maxHistoryItems)
            }

            if (imported.savedSearches && Array.isArray(imported.savedSearches)) {
              state.savedSearches = imported.savedSearches.slice(0, 100)
            }

            if (imported.settings) {
              Object.assign(state, imported.settings)
            }
          })

          return true
        } catch (error) {
          console.error('Failed to import search data:', error)
          return false
        }
      },
    }),
    {
      name: 'search-store-v1',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        savedSearches: state.savedSearches,
        autoSaveHistory: state.autoSaveHistory,
        showSuggestions: state.showSuggestions,
        maxSuggestions: state.maxSuggestions,
      }),
      version: 1,
    }
  )
)

// Selectors
export const useRecentSearches = () => useSearchStore(state =>
  state.searchHistory.slice(0, 10)
)

export const useFavoriteSearches = () => useSearchStore(state =>
  state.savedSearches.slice(0, 10)
)