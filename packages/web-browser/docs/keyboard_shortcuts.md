# TaskWizer Browser - Keyboard Shortcuts & Navigation Features

This document describes all keyboard shortcuts and navigation features available in the TaskWizer Browser.

## Address Bar Shortcuts

The address bar supports several keyboard shortcuts for quick navigation and URL completion:

### Basic Navigation

- **Enter**: Navigate to URL or search with Gemini AI
  - If input contains a dot (`.`) or starts with `localhost` or `http`, it's treated as a URL
  - Otherwise, it's treated as a search query and sent to Gemini AI

### URL Auto-Completion Shortcuts

These shortcuts automatically add common domain prefixes and suffixes:

- **CTRL + Enter**: Add `www.` prefix and `.com` suffix
  - Example: Type `google` → Press CTRL+Enter → Navigate to `https://www.google.com`
  
- **SHIFT + Enter**: Add `www.` prefix and `.org` suffix
  - Example: Type `wikipedia` → Press SHIFT+Enter → Navigate to `https://www.wikipedia.org`
  
- **CTRL + SHIFT + Enter**: Add `www.` prefix and `.net` suffix
  - Example: Type `example` → Press CTRL+SHIFT+Enter → Navigate to `https://www.example.net`

### New Tab Navigation

- **ALT + Enter**: Open URL in new tab
  - Works with both URLs and search queries
  - Example: Type `github.com` → Press ALT+Enter → Opens GitHub in a new tab

## Mouse Shortcuts

### Home Button

- **Left-click**: Navigate current tab to home page (New Tab page)
- **Middle-click**: Open home page in a new tab

## Navigation Buttons

### Back/Forward Buttons

- **Back button**: Navigate to previous page in history
  - Disabled when at the beginning of history
  
- **Forward button**: Navigate to next page in history
  - Disabled when at the end of history

### Reload Button

- **Reload button**: Reload the current page
  - Refreshes the current page content

### Vertical Tabs Toggle

- **Vertical Tabs button**: Toggle between horizontal and vertical tab layout

## Tips & Tricks

1. **Quick .com navigation**: Just type the domain name (without www. or .com) and press CTRL+Enter
   - `google` + CTRL+Enter = `https://www.google.com`
   - `github` + CTRL+Enter = `https://www.github.com`

2. **Quick .org navigation**: For non-profit and organization websites, use SHIFT+Enter
   - `wikipedia` + SHIFT+Enter = `https://www.wikipedia.org`
   - `mozilla` + SHIFT+Enter = `https://www.mozilla.org`

3. **Quick .net navigation**: For network-related sites, use CTRL+SHIFT+Enter
   - `example` + CTRL+SHIFT+Enter = `https://www.example.net`

4. **Open in background tab**: Use ALT+Enter to open links in new tabs without switching to them

5. **Middle-click home**: Middle-click the home button to quickly open a new tab page

## URL Detection Logic

The browser uses the following logic to determine if input is a URL or search query:

- **Treated as URL** if input:
  - Contains a dot (`.`) - e.g., `example.com`, `192.168.1.1`
  - Starts with `localhost` - e.g., `localhost:3000`
  - Starts with `http` - e.g., `http://example.com`, `https://example.com`

- **Treated as search query** otherwise:
  - Single words without dots - e.g., `weather`, `news`
  - Questions - e.g., `what is the weather today?`
  - Multi-word phrases - e.g., `best pizza near me`

## Future Enhancements

Planned keyboard shortcuts for future releases:

- **CTRL + T**: Open new tab
- **CTRL + W**: Close current tab
- **CTRL + Tab**: Switch to next tab
- **CTRL + SHIFT + Tab**: Switch to previous tab
- **CTRL + L**: Focus address bar
- **CTRL + D**: Bookmark current page
- **CTRL + SHIFT + D**: Bookmark all tabs
- **F5**: Reload page
- **CTRL + R**: Reload page
- **CTRL + SHIFT + R**: Hard reload (bypass cache)
- **ESC**: Stop loading page
- **CTRL + +**: Zoom in
- **CTRL + -**: Zoom out
- **CTRL + 0**: Reset zoom
- **CTRL + F**: Find in page
- **CTRL + H**: Open history
- **CTRL + SHIFT + Delete**: Clear browsing data

---

**Last Updated**: 2025-10-25
**Version**: 1.0.0

