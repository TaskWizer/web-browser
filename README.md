<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TaskWizer Browser

An AI-powered web browser simulation built with React, TypeScript, and Google's Gemini API. Experience intelligent search, tabbed browsing, and modern browser features with AI integration.

[![Built with React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite)](https://vitejs.dev/)
[![Gemini API](https://img.shields.io/badge/Gemini-API-4285f4?logo=google)](https://ai.google.dev/)

View the original app in AI Studio: https://ai.studio/apps/drive/1N8-6zv6H4jCx85oEH6O7ojMcPCIX58YK

## ✨ Features

### 🌐 Browser Functionality
- **Tabbed Browsing**: Multiple tabs with full history support (back/forward navigation)
- **Tab Groups**: Organize tabs into colored groups with custom names
- **Bookmarks**: Save and manage your favorite sites with drag-and-drop support
- **Address Bar**: Smart URL detection and search functionality
- **Page Previews**: Visual previews of external websites (when available)

### 🤖 AI Integration
- **Gemini-Powered Search**: Intelligent search results using Google's Gemini API
- **Graceful Fallback**: Automatically falls back to Google search if Gemini is unavailable
- **Markdown Formatting**: Rich, formatted AI responses

### 🎨 User Interface
- **Modern Dark Theme**: Sleek gradient design with indigo/purple accents
- **Vertical/Horizontal Tabs**: Switch between layout modes
- **Context Menus**: Comprehensive right-click menus for tabs, bookmarks, and groups
- **Responsive Design**: Works on desktop and mobile devices
- **Half-Circle Rounded Corners**: Consistent modern UI design

### 📱 Progressive Web App (PWA)
- **Installable**: Add to home screen on mobile and desktop
- **Offline Support**: Service worker caching for offline functionality
- **App-like Experience**: Runs in standalone mode when installed

### 🚀 Enhanced Features
- **Keyboard Shortcuts**: Efficient navigation with keyboard
- **Middle-Click Support**: Open links in new tabs with middle mouse button
- **Duplicate Tabs**: Quickly duplicate any tab
- **Closed Tab Recovery**: Reopen recently closed tabs
- **Bookmark Management**: Edit, delete, sort, and organize bookmarks

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/TaskWizer/web-browser.git
   cd web-browser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example file
   cp .env.local.example .env.local

   # Edit .env.local and add your Gemini API key
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🌍 Deployment

### Cloudflare Pages (Recommended)

This project is optimized for deployment on Cloudflare Pages. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

**Quick Deploy:**
1. Push to GitHub
2. Connect repository to Cloudflare Pages
3. Set build command: `npm run build`
4. Set build output: `dist`
5. Add environment variable: `VITE_GEMINI_API_KEY`

### Other Platforms

The app can be deployed to any static hosting service:
- **Vercel**: Auto-detects Vite configuration
- **Netlify**: Use build command `npm run build` and publish directory `dist`
- **GitHub Pages**: Requires additional configuration for SPA routing

## 🎯 Usage

### Basic Navigation
1. **New Tab**: Click the `+` button or use context menu
2. **Navigate**: Enter a URL or search term in the address bar
3. **Search**: Type a query and press Enter for AI-powered results
4. **Bookmarks**: Click the star icon to bookmark the current page

### Tab Management
- **Switch Tabs**: Click on any tab
- **Close Tab**: Click the `×` button or middle-click
- **Duplicate Tab**: Right-click → "Duplicate Tab"
- **Tab Groups**: Right-click → "Move to Group" → "New Group..."

### Context Menus
- **Right-click on tabs** for tab-specific actions
- **Right-click on bookmarks** to edit or delete
- **Right-click on tab groups** to rename or change color
- **Right-click on bookmark bar** to add or organize bookmarks

### Keyboard Shortcuts
- **Ctrl/Cmd + T**: New tab (via browser)
- **Ctrl/Cmd + W**: Close tab (via browser)
- **Ctrl/Cmd + Enter**: Add `.com` to address bar input
- **Middle Mouse Button**: Open link in new tab

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_GEMINI_API_KEY` | Yes* | - | Your Gemini API key |
| `VITE_GEMINI_MODEL` | No | `models/gemma-3-27b-it` | Gemini model to use |

*Required for AI search features. App works without it but falls back to Google search.

### API Key Security

⚠️ **Important**: When deploying, restrict your API key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your API key
3. Add HTTP referrer restrictions for your domain
4. Restrict to Generative Language API only

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed security setup.

## 📁 Project Structure

```
web-browser/
├── components/          # React components
│   ├── AddressBar.tsx
│   ├── BookmarkBar.tsx
│   ├── BrowserView.tsx
│   ├── ContextMenu.tsx
│   ├── Tab.tsx
│   ├── TabBar.tsx
│   └── ...
├── services/           # API services
│   └── geminiService.ts
├── public/            # Static assets
│   ├── manifest.json  # PWA manifest
│   ├── sw.js         # Service worker
│   ├── _redirects    # Cloudflare redirects
│   └── _headers      # Security headers
├── App.tsx           # Main application
├── index.tsx         # Entry point
├── types.ts          # TypeScript types
└── constants.tsx     # App constants
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- Powered by [Google Gemini API](https://ai.google.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Bundled with [Vite](https://vitejs.dev/)
- Icons from [Heroicons](https://heroicons.com/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/TaskWizer/web-browser/issues)
- **Deployment Help**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Gemini API**: [Google AI Studio Docs](https://ai.google.dev/docs)

## 🗺️ Roadmap

- [ ] Browser history panel
- [ ] Download manager
- [ ] Extensions support
- [ ] Themes customization
- [ ] Multi-language support
- [ ] Voice search integration
- [ ] Tab sync across devices

---

Made with ❤️ using Google Gemini API
