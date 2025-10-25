CRITICAL: navigation to websites do not work at all!!!!!!!!!!
Trying to browse to a URL does not function and gives an error:
- Could not load page preview: The page might be offline, block screenshot services, or the URL may be incorrect.
Add right click context menu for modifying the bookmark toolbar, edit favorite, show bookmark tab, show tab groups, etc.
Add gitignore for the project (just added to github) and `npm i` has been ran (need to ignore it and etc.)

Add PWA support with full screen manifest file and all the options.
Add support for Cloudflare Pages deployment, as well as support for either using a .env.local and/or Cloudflare Variables and Secrets for the API keys (for AI features), etc.

Fix the error and just fall back to google search on API failure.
Uncaught Error: An API Key must be set when running in a browser
    at new W_ (index-bCi3zYIJ.js:177:78)
    at index-bCi3zYIJ.js:177:1094Understand this error

Use "models/gemma-3-27b-it" for the conversational, tool call, search agent.
See .env.local for the keys and model to use. Enhance the file as you see fit.


- **Work autonomously**: Make informed decisions without asking questions
- **Deep research first**: Use `codebase-retrieval` and `git-commit-retrieval` before every change
- **Validate everything**: Never claim completion without running tests and manual verification
- **Document evidence**: Provide concrete proof (test results, screenshots, metrics) for every completion
- **No shortcuts**: Follow the full validation cycle for every task
- **Quality over speed**: Ensure correctness and completeness before moving to next task
- **Incremental progress**: Complete one task fully before starting the next
- **No regressions**: Existing functionality must continue to work

**Note**: Work autonomously without asking questions. Prioritize fixes over enhancements. Create unit tests for all new features. Avoid using `any` type in TypeScript. Use half-circle rounded corners in UI design. Validate all changes with Playwright/Puppeteer tests.

**DO NOT** claim features are fixed without actually testing them in the running application. The user has clearly indicated that many claimed fixes are not visible or working.



Fix critical bugs and implement enhancements for the Gemini Browser project. Work autonomously following the guidelines below.

## CRITICAL BUG FIXES (Priority 1)

### 1. Navigation to External URLs Completely Broken
**Problem**: Attempting to browse to any external URL fails with error message: "Could not load page preview: The page might be offline, block screenshot services, or the URL may be incorrect."
**Required Fix**: 
- Investigate why external URL navigation is not working
- Implement proper error handling and fallback behavior
- Ensure users can successfully navigate to external websites

### 2. Missing API Key Error Crashes Application
**Error**: `Uncaught Error: An API Key must be set when running in a browser` (thrown at `new W_` in index-bCi3zYIJ.js:177:78)
**Required Fix**:
- Add proper error handling for missing/invalid Gemini API keys
- Implement graceful fallback to Google search when API fails or key is missing
- Prevent application crashes due to API configuration issues
- Display user-friendly error messages instead of uncaught exceptions

## ENHANCEMENTS (Priority 2)

### 3. Add .gitignore File
**Context**: Project was just added to GitHub and `npm install` has been run
**Required**: Create a comprehensive .gitignore file that excludes:
- `node_modules/`
- Build output directories (e.g., `dist/`, `build/`)
- Environment files (`.env`, `.env.local`, `.env.*.local`)
- IDE/editor files (`.vscode/`, `.idea/`, `*.swp`, etc.)
- OS files (`.DS_Store`, `Thumbs.db`)
- Log files (`*.log`, `npm-debug.log*`)
- Any other standard Node.js/React/Vite artifacts

### 4. Enhanced Right-Click Context Menus
Add comprehensive right-click context menu options for:
- **Bookmark toolbar**: Options to modify, add, remove, or organize bookmarks
- **Individual bookmarks**: Edit favorite, rename, delete, change URL
- **Tabs**: Show bookmark tab, manage tab groups, pin/unpin tabs
- **Tab groups**: Create, rename, delete, change color of tab groups
- Ensure menus are contextually appropriate based on what is right-clicked

### 5. Progressive Web App (PWA) Support
Implement full PWA functionality:
- Create `manifest.json` with all required fields:
  - App name, short name, description
  - Icons in multiple sizes (192x192, 512x512 minimum)
  - `display: "fullscreen"` mode
  - Theme color and background color
  - Start URL and scope
  - Orientation preferences
- Add service worker for offline support
- Ensure app is installable on desktop and mobile devices
- Test PWA installation and offline functionality

### 6. Cloudflare Pages Deployment Support
Implement deployment configuration for Cloudflare Pages:
- Add necessary build configuration files for Cloudflare Pages
- Support dual API key configuration methods:
  - **Local development**: Use `.env.local` file for `GEMINI_API_KEY`
  - **Production (Cloudflare)**: Use Cloudflare Environment Variables and Secrets
- Ensure build process works correctly on Cloudflare Pages
- Add deployment instructions to documentation
- Handle API key loading from both sources with proper fallback logic

## WORK GUIDELINES

**Autonomous Operation**:
- Make informed decisions without asking questions
- Use `codebase-retrieval` and `git-commit-retrieval` extensively before making changes
- Research existing patterns in the codebase and follow them

**Quality Standards**:
- Create unit tests for all new features and bug fixes
- Avoid using `any` type in TypeScript - use proper type definitions
- Use half-circle rounded corners (e.g., `rounded-full` or specific border-radius values) in UI design
- Validate all changes with actual testing in the running application

**Validation Requirements**:
- Run the application locally and manually verify each fix/feature works
- Execute all tests and ensure they pass
- Provide concrete evidence (test results, screenshots, console output) for completion
- Ensure no regressions - existing functionality must continue to work

**Execution Order**:
- Prioritize bug fixes (items 1-2) over enhancements (items 3-6)
- Complete one task fully with validation before moving to the next
- Do NOT claim features are fixed without actually testing them in the running application