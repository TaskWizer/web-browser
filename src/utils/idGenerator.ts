/**
 * Utility functions for generating unique IDs
 */

// Counter for simple incremental IDs
let counter = 0

/**
 * Generate a simple incremental ID
 */
export function generateSimpleId(): string {
  return `id_${++counter}`
}

/**
 * Generate a timestamp-based ID
 */
export function generateTimestampId(prefix = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a UUID v4 compliant ID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate a short ID (6 characters)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 6)
}

/**
 * Generate a tab-specific ID
 */
export function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a bookmark-specific ID
 */
export function generateBookmarkId(): string {
  return `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a group-specific ID
 */
export function generateGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a context-specific ID
 */
export function generateContextId(): string {
  return `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Default export - the most commonly used ID generator
 */
export function generateId(prefix = 'item'): string {
  return generateTimestampId(prefix)
}