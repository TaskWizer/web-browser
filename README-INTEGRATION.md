# TaskWizer Web Browser - Integration Guide

This comprehensive guide covers seamless integration of the TaskWizer Web Browser into various deployment scenarios including standalone applications, micro-service architectures, and mono-repo structures.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Deployment Modes](#deployment-modes)
3. [Integration Steps](#integration-steps)
4. [Configuration](#configuration)
5. [API Integration](#api-integration)
6. [Customization](#customization)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Core Components

```
src/
├── components/          # React UI components
├── stores/             # Zustand state management
├── services/           # External API integrations
├── lib/               # Utility libraries
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

### Key Dependencies

- **React 19** - Modern UI framework with concurrent features
- **Zustand** - Lightweight state management
- **Tailwind CSS v4** - Modern styling system
- **Sentry** - Error tracking and performance monitoring
- **Vite PWA** - Progressive Web App capabilities

### External Services

- **Gemini AI** - AI-powered search functionality
- **jina.ai** - Content fetching and CORS proxy
- **Cloudflare Pages** - Deployment platform (optional)

## Deployment Modes

### 1. Standalone Application

**Best for:** Independent deployment, dedicated hosting, or PWA distribution

#### Build Configuration
```bash
# Build as standalone PWA
npm run build:spa

# Preview locally
npm run preview
```

#### Docker Deployment
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:spa

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Environment Variables
```bash
# Production
VITE_APP_NAME=TaskWizer Browser
VITE_APP_VERSION=1.0.0
VITE_BUILD_MODE=spa

# Gemini AI (optional)
VITE_GEMINI_API_KEY=your_api_key_here
VITE_GEMINI_MODEL=models/gemini-pro

# Sentry (optional)
VITE_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
```

### 2. Micro-Service Architecture

**Best for:** Integration into existing micro-service ecosystems

#### Service Components

1. **Frontend Service** (Port 3003)
   - React application
   - PWA capabilities
   - User interface

2. **API Proxy Service** (Port 3002)
   - CORS proxy
   - Content fetching
   - Security layer

3. **Gemini AI Service** (Optional)
   - AI search functionality
   - Natural language processing

#### Docker Compose Example
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3003:3003"
    environment:
      - API_BASE_URL=http://api-service:3002
    depends_on:
      - api-service

  api-service:
    build: ./server
    ports:
      - "3002:3002"
    environment:
      - PROXY_TARGET=https://r.jina.ai/http://
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
```

#### Nginx Configuration
```nginx
upstream frontend {
    server frontend:3003;
}

upstream api {
    server api-service:3002;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API routes
    location /api/ {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # PWA assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Mono-Repo Integration

**Best for:** Large codebases with shared dependencies

#### Package Structure
```
mono-repo/
├── packages/
│   ├── web-browser/          # This package
│   ├── shared/               # Shared utilities
│   └── ai-agent/             # AI agent integration
├── apps/
│   ├── webos/                # Main WebOS application
│   └── dashboard/            # Admin dashboard
└── tools/
    ├── build-scripts/        # Build automation
    └── deployment/           # Deployment scripts
```

#### Package.json (Mono-Repo Root)
```json
{
  "name": "@taskwizer/mono-repo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build:browser": "npm run build --workspace=@taskwizer/web-browser",
    "dev:browser": "npm run dev --workspace=@taskwizer/web-browser",
    "test:browser": "npm run test --workspace=@taskwizer/web-browser",
    "build:all": "npm run build --workspaces",
    "dev:all": "concurrently \"npm run dev:browser\" \"npm run dev:webos\""
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```

#### Shared Dependencies
```json
// packages/shared/package.json
{
  "name": "@taskwizer/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "dependencies": {
    "typescript": "^5.0.0",
    "zod": "^3.20.0"
  }
}
```

## Integration Steps

### Step 1: Environment Setup

#### Development Environment
```bash
# Clone the repository
git clone <repository-url>
cd web-browser

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

#### Production Environment
```bash
# Set production environment
export NODE_ENV=production

# Build for your target mode
npm run build:spa    # Standalone
# OR
npm run build:library # Library mode

# Deploy
npm run preview       # Or deploy to your hosting platform
```

### Step 2: Configuration

#### Create Configuration File
```typescript
// src/config/index.ts
export const config = {
  app: {
    name: process.env.VITE_APP_NAME || 'TaskWizer Browser',
    version: process.env.VITE_APP_VERSION || '1.0.0',
    buildMode: process.env.VITE_BUILD_MODE || 'spa',
  },
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:3002',
    timeout: parseInt(process.env.VITE_API_TIMEOUT || '15000'),
  },
  gemini: {
    apiKey: process.env.VITE_GEMINI_API_KEY,
    model: process.env.VITE_GEMINI_MODEL || 'models/gemini-pro',
    enabled: !!process.env.VITE_GEMINI_API_KEY,
  },
  sentry: {
    dsn: process.env.VITE_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  },
  features: {
    pwa: process.env.VITE_BUILD_MODE === 'spa',
    analytics: process.env.VITE_ENABLE_ANALYTICS === 'true',
    debug: process.env.VITE_DEBUG === 'true',
  },
}
```

### Step 3: Integration Code

#### Import as Library
```typescript
// In your main application
import { WebBrowserApp } from '@taskwizer/web-browser'
import '@taskwizer/web-browser/dist/styles.css'

function App() {
  return (
    <div>
      <header>Your App Header</header>
      <main>
        <WebBrowserApp
          config={{
            theme: 'dark',
            enableGeminisearch: true,
            customStyles: {
              primaryColor: '#3b82f6',
            }
          }}
          onNavigate={(url) => {
            console.log('Navigated to:', url)
          }}
        />
      </main>
    </div>
  )
}
```

#### Custom Integration
```typescript
// src/integration/browser-integration.ts
import { useBrowserStore } from '@taskwizer/web-browser/stores'

export function useBrowserIntegration() {
  const browserStore = useBrowserStore()

  return {
    // Expose browser actions
    createTab: browserStore.createTab,
    navigateTo: browserStore.navigateTab,

    // Expose browser state
    activeTab: browserStore.activeTabId,
    tabs: browserStore.tabs,

    // Custom logic
    openInNewTab: (url: string) => {
      browserStore.createTab(url)
    },

    searchAndNavigate: (query: string) => {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
      browserStore.navigateTab(browserStore.activeTabId!, searchUrl)
    }
  }
}
```

## API Integration

### Custom Backend Integration

```typescript
// src/services/customBackend.ts
import { reportError } from '../lib/sentry'

interface CustomConfig {
  baseUrl: string
  apiKey?: string
  timeout?: number
}

class CustomBackendService {
  private config: CustomConfig

  constructor(config: CustomConfig) {
    this.config = {
      timeout: 15000,
      ...config,
    }
  }

  async fetchContent(url: string): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/proxy?url=${encodeURIComponent(url)}`, {
        headers: {
          'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : '',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.content || ''
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), {
        service: 'customBackend',
        operation: 'fetchContent',
        url,
      })
      throw error
    }
  }
}

export const customBackendService = new CustomBackendService({
  baseUrl: process.env.VITE_CUSTOM_API_URL || 'http://localhost:3002',
  apiKey: process.env.VITE_CUSTOM_API_KEY,
})
```

### Authentication Integration

```typescript
// src/services/authService.ts
interface User {
  id: string
  email: string
  preferences: Record<string, any>
}

class AuthService {
  private user: User | null = null

  async login(credentials: { email: string; password: string }): Promise<User> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const user = await response.json()
    this.user = user

    // Store user preferences in browser state
    const browserStore = useBrowserStore.getState()
    if (user.preferences) {
      browserStore.updateSettings(user.preferences)
    }

    return user
  }

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' })
    this.user = null
  }

  getUser(): User | null {
    return this.user
  }
}

export const authService = new AuthService()
```

## Customization

### Theme Customization

```css
/* src/styles/custom-theme.css */
:root {
  --browser-primary: #3b82f6;
  --browser-secondary: #6366f1;
  --browser-bg: #0f0f1e;
  --browser-surface: #1a1a2e;
  --browser-border: #2a2a3e;
  --browser-text: #f3f4f6;
}

[data-theme="light"] {
  --browser-bg: #ffffff;
  --browser-surface: #f8fafc;
  --browser-border: #e2e8f0;
  --browser-text: #1a202c;
}

/* Custom component styles */
.browser-chrome {
  background: var(--browser-surface);
  border-bottom: 1px solid var(--browser-border);
}

.address-bar {
  background: var(--browser-bg);
  color: var(--browser-text);
  border: 1px solid var(--browser-border);
}
```

### Component Extension

```typescript
// src/components/CustomBrowserView.tsx
import React from 'react'
import { BrowserView } from './BrowserView'
import { useBrowserStore } from '../stores/browserStore'

interface CustomBrowserViewProps {
  customActions?: React.ReactNode
  onCustomAction?: (action: string, data: any) => void
}

export const CustomBrowserView: React.FC<CustomBrowserViewProps> = ({
  customActions,
  onCustomAction,
  ...props
}) => {
  const activeTab = useActiveTab()

  return (
    <div className="custom-browser-container">
      {customActions && (
        <div className="custom-actions-bar">
          {customActions}
        </div>
      )}
      <BrowserView {...props} />

      {/* Custom functionality */}
      {activeTab?.url.includes('example.com') && (
        <div className="example-overlay">
          Special content for example.com
        </div>
      )}
    </div>
  )
}
```

### Plugin System

```typescript
// src/plugins/plugin-system.ts
interface BrowserPlugin {
  id: string
  name: string
  version: string
  initialize: (api: BrowserAPI) => void
  destroy: () => void
}

interface BrowserAPI {
  createTab: (url?: string) => string
  navigateTab: (tabId: string, url: string) => void
  addBookmark: (bookmark: Bookmark) => void
  registerComponent: (name: string, component: React.ComponentType) => void
}

class PluginManager {
  private plugins: Map<string, BrowserPlugin> = new Map()
  private api: BrowserAPI

  constructor(api: BrowserAPI) {
    this.api = api
  }

  register(plugin: BrowserPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} already registered`)
    }

    this.plugins.set(plugin.id, plugin)
    plugin.initialize(this.api)
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      plugin.destroy()
      this.plugins.delete(pluginId)
    }
  }

  getPlugin(id: string): BrowserPlugin | undefined {
    return this.plugins.get(id)
  }

  listPlugins(): BrowserPlugin[] {
    return Array.from(this.plugins.values())
  }
}

export { BrowserPlugin, BrowserAPI, PluginManager }
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors
```bash
# Ensure proxy service is running
cd server && npm start

# Check environment variables
echo $VITE_API_BASE_URL
```

#### 2. Build Errors
```bash
# Clear cache
rm -rf node_modules dist
npm install

# Check TypeScript
npm run type-check

# Run tests
npm run test
```

#### 3. PWA Installation Issues
```bash
# Check HTTPS requirement
# PWA requires HTTPS in production

# Verify manifest.json
# Ensure manifest.json is accessible
curl https://your-domain.com/manifest.json
```

#### 4. Sentry Integration
```bash
# Verify DSN configuration
echo $VITE_SENTRY_DSN

# Test error reporting
# Trigger an error in browser console
```

### Debug Mode

```typescript
// Enable debug logging
if (process.env.VITE_DEBUG === 'true') {
  console.log('Debug mode enabled')
  window.browserDebug = {
    store: useBrowserStore.getState(),
    config,
    version: '1.0.0',
  }
}
```

### Performance Optimization

```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map()

  static startTiming(name: string): void {
    this.measurements.set(name, performance.now())
  }

  static endTiming(name: string): number {
    const start = this.measurements.get(name)
    if (start === undefined) return 0

    const duration = performance.now() - start
    this.measurements.delete(name)

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  static measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTiming(name)
    return fn().finally(() => {
      this.endTiming(name)
    })
  }
}
```

## Support

### Documentation
- [Testing Guide](./README-TESTING.md)
- [PWA Guide](./README-PWA.md)
- [API Reference](./docs/API.md)

### Contributing
- Fork the repository
- Create a feature branch
- Add tests for new functionality
- Submit a pull request

### Issues
- Report bugs on GitHub Issues
- Include reproduction steps
- Provide environment details

---

For additional support or questions, refer to the project documentation or contact the development team.