# TaskWizer Web Browser - Deployment Guide

This package supports multiple deployment modes to suit different use cases:

## 1. Standalone SPA Deployment (Cloudflare Pages)

Deploy the web browser as a standalone Single Page Application.

### Build Command
```bash
npm run build:pages
```

### Environment Variables
Set these in your Cloudflare Pages dashboard:

- `VITE_GEMINI_API_KEY`: Gemini API key for AI features (optional)
- `VITE_GEMINI_MODEL`: AI model to use (default: `models/gemma-3-27b-it`)
- `BUILD_MODE`: Set to `spa` (automatically set by build script)

### Cloudflare Pages Configuration

1. **Build Command**: `npm run build:pages`
2. **Build output directory**: `dist`
3. **Node.js version**: `22`

The standalone mode includes mock implementations for shared package dependencies, making it completely self-contained.

## 2. Mono-repo Package Deployment

Use as part of the TaskWizer mono-repo where shared dependencies are available.

### Build Command
```bash
npm run build:library
```

### Usage in other packages:
```typescript
import { WebBrowserApp } from '@taskwizer/web-browser';
import { createWebBrowserConfig } from '@taskwizer/web-browser';

const config = createWebBrowserConfig({
  standalone: false,
  enableApi: true,
  apiBasePath: '/api/web-browser'
});
```

## 3. API Micro-service Deployment

Deploy as a standalone API micro-service using Express.js or Cloudflare Workers.

### Local Development
```bash
# Start the API server
npm run server:start

# Start the frontend in parallel
npm run dev
```

### Express.js Deployment (Recommended)

#### Build
```bash
# No build needed - runtime is Node.js
cd server
npm install
```

#### Environment Variables
- `PORT`: Server port (default: 3001)
- `GEMINI_API_KEY`: Gemini API key for AI features
- `NODE_ENV`: Set to `production` for production deployment

#### Deployment
Deploy to any Node.js hosting platform (Railway, Render, Vercel, etc.).

### Cloudflare Workers Deployment

#### Build
```bash
# Build for Workers
npm run build:worker
```

#### Wrangler Configuration
See `api/wrangler.toml` for Workers configuration.

#### Deploy
```bash
cd api
npx wrangler deploy
```

## 4. Full Stack Development

For local development with both frontend and API:

```bash
# Terminal 1: Start API server
npm run server:start

# Terminal 2: Start frontend development server
npm run dev
```

The frontend will automatically proxy API requests to the backend server at `http://localhost:3001`.

## Environment Configuration

### Development
- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`
- Health check: `http://localhost:3001/health`

### Production Endpoints

#### API Endpoints
- `GET /health` - Health check
- `POST /api/gemini` - AI chat completion
- `POST /api/browser/navigate` - Browser navigation
- `POST /api/content/render` - Content rendering
- `GET/POST /api/proxy/*` - Proxy to external services

#### CORS Configuration
The API server accepts requests from:
- `http://localhost:5173` (development)
- `http://localhost:5174` (development)
- `https://taskwizer.com` (production)

## Build Output

### Library Mode (`dist/`)
- `index.es.js` - ES module bundle
- `index.umd.js` - UMD bundle
- `web-browser.css` - Compiled styles
- Type definitions in `dist/`

### SPA Mode (`dist/`)
- `index.html` - Application entry point
- `assets/` - Compiled JavaScript and CSS
- Static assets from `public/`

## Deployment Matrix

| Mode | Build Command | Output | Use Case |
|------|--------------|--------|----------|
| Library | `npm run build:library` | JS/CSS bundles | Mono-repo integration |
| SPA | `npm run build:pages` | Full web app | Cloudflare Pages |
| API Server | `npm run server:start` | Running server | Micro-service |
| Development | `npm run dev` | Dev server | Local development |

## Troubleshooting

### TypeScript Configuration Errors
If you encounter "Cannot find base config file" errors, ensure you're using the correct build mode for your deployment type.

### API Connection Issues
- Ensure the API server is running on port 3001
- Check that environment variables are set correctly
- Verify CORS configuration for your domain

### Build Failures
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version compatibility (requires Node.js 22+)
- Verify environment variables are properly set

## Version Compatibility

- Node.js: 22+
- npm: 10+
- Cloudflare Workers: Supported
- Cloudflare Pages: Supported
- Vercel: Supported
- Railway: Supported