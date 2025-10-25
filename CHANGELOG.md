# Changelog

All notable changes to the Gemini Browser project are documented in this file.

## [1.1.0] - 2025-10-25

### 🐛 Critical Bug Fixes

#### Fixed External URL Navigation
- **Issue**: External URLs failed to load with "Could not load page preview" error
- **Solution**: 
  - Implemented proper error handling with try-catch blocks around preview loading
  - Added 5-second timeout for screenshot service requests
  - Created beautiful fallback UI when screenshots fail to load
  - Graceful degradation ensures navigation works even without previews
  - Enhanced error logging for debugging
- **Impact**: Users can now successfully navigate to external websites (google.com, github.com, etc.)

#### Fixed Missing API Key Crashes
- **Issue**: Application crashed with "Uncaught Error: An API Key must be set" when Gemini API key was missing
- **Solution**:
  - Wrapped API initialization in try-catch blocks
  - Implemented graceful degradation to Google search when Gemini is unavailable
  - Added user-friendly error messages with setup instructions
  - Application remains functional for basic browsing without API key
  - Added `isGeminiAvailable()` helper function
- **Impact**: App no longer crashes and provides helpful guidance for API setup

### ✨ New Features

#### Enhanced Context Menus
Comprehensive right-click context menus for all browser elements:

**Tab Context Menu**:
- Reload Tab
- Duplicate Tab
- Pin Tab (placeholder for future implementation)
- Add to Bookmarks
- Move to Group (with submenu for group selection)
- Create New Group
- Remove from Group
- Close Tab / Close Other Tabs / Close Tabs to the Right

**Bookmark Context Menu**:
- Open in New Tab
- Edit Title
- Edit URL
- Copy URL to clipboard
- Delete Bookmark

**Bookmark Bar Context Menu**:
- Add Bookmark
- Sort by Name
- Show/Hide Bookmarks Bar

**Tab Group Context Menu**:
- Rename Group
- Change Color (6 color options)
- Add New Tab to Group
- Ungroup Tabs
- Close Group (with confirmation)

**Features**:
- Menu separators for better organization
- Disabled states for unavailable actions
- Submenu support for nested options
- Keyboard-accessible (Shift+F10)

#### Progressive Web App (PWA) Support
Full PWA implementation for installable app experience:

**Manifest Configuration**:
- App name, description, and branding
- Custom icons (192x192 and 512x512)
- Standalone display mode
- Theme colors matching app design
- App shortcuts for quick actions

**Service Worker**:
- Cache-first strategy for static assets
- Network-first for dynamic content
- Offline fallback support
- Automatic cache versioning and cleanup
- Background cache updates
- Install, activate, and fetch event handlers

**Integration**:
- Service worker registration in main app
- Automatic update checking (every 60 seconds)
- Manifest linked in HTML
- Apple touch icon support
- Theme color meta tags

**Benefits**:
- Install to home screen on mobile/desktop
- Offline functionality
- Faster load times after first visit
- App-like experience

#### Cloudflare Pages Deployment Support
Complete deployment configuration for Cloudflare Pages:

**Configuration Files**:
- `public/_redirects`: SPA routing support
- `public/_headers`: Security and performance headers
- `DEPLOYMENT.md`: Comprehensive deployment guide

**Environment Variables**:
- Dual support for `VITE_` prefixed and non-prefixed variables
- Local development via `.env.local`
- Production via Cloudflare environment variables
- Automatic fallback handling

**Security Headers**:
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy

**Documentation**:
- Step-by-step deployment instructions
- API key security best practices
- Custom domain setup
- Troubleshooting guide
- Monitoring and analytics

#### Project Infrastructure

**Added .gitignore**:
- Comprehensive exclusions for Node.js/React/Vite
- Environment files protection
- IDE/editor configurations
- OS-specific files
- Build outputs and caches

**Environment Configuration**:
- `.env.local.example`: Template for environment variables
- Enhanced `.env.local` with comments and documentation
- Support for both development and production environments

### 🔧 Improvements

#### API Integration
- Better error messages with actionable instructions
- Fallback to Google search when Gemini unavailable
- Support for configurable model names via environment variables
- Improved API key detection and validation

#### User Interface
- Half-circle rounded corners throughout (using `rounded-full`)
- Beautiful gradient fallback view for failed page previews
- Enhanced loading states with better visual feedback
- Improved error messages with helpful context

#### Code Quality
- Proper TypeScript types (no `any` types used)
- Comprehensive JSDoc comments
- Better error handling throughout
- Consistent code style and patterns

#### Documentation
- Comprehensive README with features, setup, and usage
- Detailed DEPLOYMENT.md for Cloudflare Pages
- CHANGELOG.md for tracking changes
- Inline code comments for complex logic

### 🎨 UI/UX Enhancements

- **Fallback Page Preview**: Beautiful gradient design with site info when screenshots fail
- **Context Menu Separators**: Visual organization with `---` separator support
- **Disabled Menu Items**: Clear visual feedback for unavailable actions
- **Loading States**: Improved spinner and loading messages
- **Error Messages**: User-friendly with actionable next steps

### 📦 Dependencies

No new dependencies added - all features implemented with existing packages:
- React 19.2.0
- TypeScript 5.8.2
- Vite 6.2.0
- @google/genai 1.27.0

### 🧪 Testing

**Manual Testing Completed**:
- ✅ External URL navigation (google.com, github.com, wikipedia.org)
- ✅ Gemini API integration with valid key
- ✅ Graceful fallback when API key missing
- ✅ Context menus for tabs, bookmarks, and groups
- ✅ Tab duplication and management
- ✅ Bookmark CRUD operations
- ✅ Tab group creation and management
- ✅ Build process (`npm run build`)
- ✅ Production preview (`npm run preview`)
- ✅ Service worker registration
- ✅ PWA manifest validation

### 📝 Configuration Changes

**vite.config.ts**:
- Enhanced environment variable handling
- Support for both VITE_ and non-prefixed variables
- Better fallback logic

**index.html**:
- Added PWA manifest link
- Added theme-color meta tag
- Added Apple touch icon
- Updated favicon to custom icon

**index.tsx**:
- Added service worker registration
- Automatic update checking
- Error handling for SW registration

### 🔒 Security

- Environment variables properly configured
- API keys never committed to repository
- Security headers for production deployment
- Content Security Policy implementation
- API key restriction documentation

### 📚 Documentation

**New Files**:
- `DEPLOYMENT.md`: Complete deployment guide
- `CHANGELOG.md`: This file
- `.env.local.example`: Environment variable template
- `.gitignore`: Git exclusions

**Updated Files**:
- `README.md`: Comprehensive project documentation
- `.env.local`: Enhanced with comments

### 🚀 Performance

- Service worker caching for faster loads
- Optimized build output
- Lazy loading where appropriate
- Efficient state management

### 🐛 Known Issues

None at this time. All critical bugs have been resolved.

### 🔮 Future Enhancements

Potential features for future releases:
- Pin/unpin tab functionality (UI ready, logic pending)
- Browser history panel
- Download manager
- Extensions support
- Custom themes
- Multi-language support
- Voice search integration
- Tab sync across devices

---

## How to Update

### From Previous Version

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Install any new dependencies:
   ```bash
   npm install
   ```

3. Update your `.env.local` file:
   ```bash
   # Add VITE_ prefix to existing variables
   VITE_GEMINI_API_KEY=your_key_here
   VITE_GEMINI_MODEL=models/gemma-3-27b-it
   ```

4. Rebuild the application:
   ```bash
   npm run build
   ```

5. If deploying to Cloudflare Pages:
   - Update environment variables in Cloudflare dashboard
   - Add `VITE_` prefix to variable names
   - Trigger a new deployment

---

**Note**: This release focuses on stability, user experience, and deployment readiness. All critical bugs have been fixed, and the application is production-ready.

