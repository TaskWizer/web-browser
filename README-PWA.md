# Progressive Web App (PWA) Implementation

This document outlines the PWA implementation for the TaskWizer Web Browser application.

## Features Implemented

### ✅ Service Worker
- **Automatic Registration**: Service worker is automatically registered when the app loads
- **Caching Strategy**: Intelligent caching for optimal performance
  - Network-first for API requests (jina.ai proxy)
  - Cache-first for static assets (images, fonts)
  - Runtime caching for better offline experience
- **Background Sync**: Ensures data consistency when coming back online

### ✅ App Manifest
- **Installable**: Can be installed as a native app on supported devices
- **Offline Support**: Works offline with cached content
- **App Shortcuts**: Quick access to common actions
- **Responsive Design**: Adapts to different screen sizes

### ✅ Update Management
- **Auto-Update**: Automatically checks for app updates
- **User Prompts**: Friendly prompts for installation and updates
- **Seamless Updates**: Updates happen in the background without disrupting user experience

### ✅ Offline Indicators
- **Connection Status**: Shows when the user is offline
- **Graceful Degradation**: App remains functional even without network connectivity

## Technical Implementation

### Service Worker Configuration
```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/r\.jina\.ai\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'jina-api-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
        },
      },
      // ... more caching strategies
    ],
  },
})
```

### Caching Strategies

1. **Network First (API Requests)**
   - Always tries network first
   - Falls back to cache if network fails
   - Updates cache in background
   - Used for: jina.ai API, dynamic content

2. **Cache First (Static Assets)**
   - Serves from cache immediately
   - Updates cache in background
   - Used for: images, fonts, CSS, JS

3. **Stale While Revalidate**
   - Serves from cache immediately
   - Updates cache in background
   - Used for: frequently accessed content

### Offline Functionality

When offline, the application:
- Shows cached pages that were previously visited
- Displays offline indicator
- Allows navigation to cached content
- Queues actions for when connection is restored

## Installation

### Development
```bash
npm run dev
```
The PWA features are available in development mode for testing.

### Production Build
```bash
npm run build:spa
npm run preview
```
Production builds include optimized service worker and manifest.

## Testing PWA Features

### In Chrome/Edge
1. Open DevTools (F12)
2. Go to Application tab
3. Check Service Worker, Manifest, and Storage sections

### In Firefox
1. Open about:debugging
2. Go to This Firefox → Workers
3. Check service worker status

### On Mobile Devices
1. Open the app in mobile browser
2. Look for "Add to Home Screen" prompt
3. Install and test offline functionality

## Deployment Considerations

### HTTPS Requirement
PWA requires HTTPS in production (localhost works for development).

### Service Worker Scope
The service worker scope is set to `/` to cover the entire application.

### Cache Management
- API cache: 24 hours expiration, 10 entries max
- Image cache: 30 days expiration, 100 entries max
- Font cache: 1 year expiration, 20 entries max

## Troubleshooting

### Service Worker Not Registering
- Check if the site is served over HTTPS
- Verify service worker file exists in build output
- Check browser console for errors

### App Not Installable
- Ensure manifest.json is valid
- Verify icons exist at specified paths
- Check if site meets PWA installability criteria

### Caching Issues
- Clear browser cache and service worker
- Check network tab for failed requests
- Verify cache policies in DevTools

## Future Enhancements

### Planned Features
- [ ] Background sync for user actions
- [ ] Push notifications for important updates
- [ ] Web Share API integration
- [ ] Enhanced offline page editing
- [ ] File system access for offline files

### Performance Optimizations
- [ ] Preload critical resources
- [ ] Optimize bundle sizes
- [ ] Implement resource hints (preload, prefetch)
- [ ] Service worker navigation preload

## Browser Support

The PWA supports all modern browsers:
- ✅ Chrome 88+
- ✅ Firefox 90+
- ✅ Safari 14+
- ✅ Edge 88+

## Security Considerations

### Content Security Policy
Ensure proper CSP headers are configured for PWA security.

### Service Worker Security
Service worker is sandboxed and cannot access:
- DOM directly
- LocalStorage/SessionStorage
- Sensitive APIs

### Cache Security
- No sensitive data cached in service worker
- API responses filtered before caching
- Regular cache cleanup to prevent data leakage