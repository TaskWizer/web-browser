# Web Browser API Documentation

The Web Browser API provides RESTful endpoints for browser automation, content rendering, and web content processing. It can be deployed as a standalone microservice or used in integrated mode.

## Overview

- **Base URL**: `/api/web-browser`
- **Authentication**: JWT Bearer token required
- **Content-Type**: `application/json`
- **Rate Limiting**: Applied per user/IP

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_WEB_BROWSER_API` | `false` | Enable/disable API |
| `WEB_BROWSER_STANDALONE` | `false` | Run in standalone mode |
| `WEB_BROWSER_API_BASE_PATH` | `/api/web-browser` | API base path |
| `WEB_BROWSER_ENABLE_PDF` | `true` | Enable PDF processing |
| `WEB_BROWSER_ENABLE_EPUB` | `true` | Enable EPUB processing |
| `WEB_BROWSER_MAX_FILE_SIZE` | `10485760` | Max file size (10MB) |

### Deployment Modes

#### Integrated Mode (Default)
```bash
# API is disabled by default
ENABLE_WEB_BROWSER_API=false
```

#### Microservice Mode
```bash
# Enable API and standalone deployment
ENABLE_WEB_BROWSER_API=true
WEB_BROWSER_STANDALONE=true
```

## Authentication

All endpoints (except `/health` and `/docs`) require authentication:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     https://your-domain.com/api/web-browser/browser/navigate
```

## API Endpoints

### Health Check

#### GET `/health`

Check API health status and configuration.

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "version": "1.0.0",
    "config": {
      "enableApi": true,
      "standalone": false,
      "apiBasePath": "/api/web-browser"
    },
    "services": {
      "api": true,
      "auth": true,
      "storage": true
    }
  }
}
```

### API Documentation

#### GET `/docs`

Get OpenAPI-style documentation for all endpoints.

**Authentication**: Not required

**Response**: Full API documentation object

## Browser Automation Endpoints

### Navigate to URL

#### POST `/browser/navigate`

Navigate to a specified URL and create a browser session.

**Request Body**:
```json
{
  "url": "https://example.com",
  "waitForSelector": ".content",
  "timeout": 10000,
  "userAgent": "Custom Browser Agent",
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-session-id",
    "url": "https://example.com",
    "status": "loaded",
    "loadTime": 1250,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Invalid URL format
- `500`: Navigation failed

### Take Screenshot

#### POST `/browser/screenshot`

Capture a screenshot of the current page.

**Headers**:
- `X-Browser-Session`: Browser session ID (or use `sessionId` query param)

**Request Body**:
```json
{
  "width": 1920,
  "height": 1080,
  "format": "png",
  "quality": 90,
  "fullPage": true,
  "selector": ".main-content"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-session-id",
    "format": "png",
    "width": 1920,
    "height": 1080,
    "size": 102400,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

**Error Responses**:
- `404`: No active session found
- `403`: Access denied to session
- `500`: Screenshot failed

### Execute JavaScript

#### POST `/browser/execute`

Execute JavaScript in the browser context.

**Headers**:
- `X-Browser-Session`: Browser session ID

**Request Body**:
```json
{
  "script": "document.title",
  "args": ["arg1", "arg2"],
  "timeout": 5000
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-session-id",
    "script": "document.title",
    "args": ["arg1", "arg2"],
    "result": {
      "type": "string",
      "value": "Example Page Title",
      "timestamp": "2024-01-01T12:00:00.000Z"
    },
    "executionTime": 125,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `404`: No active session found
- `403`: Access denied to session
- `500`: Script execution failed

### Get Session Information

#### GET `/browser/session/:sessionId`

Get information about an active browser session.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-session-id",
    "url": "https://example.com",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "lastActivity": "2024-01-01T12:05:00.000Z",
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "userAgent": "Custom Browser Agent"
  }
}
```

**Error Responses**:
- `404`: Session not found
- `403`: Access denied

### Close Session

#### DELETE `/browser/session/:sessionId`

Close a browser session and clean up resources.

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid-session-id",
    "closedAt": "2024-01-01T12:10:00.000Z"
  }
}
```

**Error Responses**:
- `404`: Session not found
- `403`: Access denied
- `500`: Session close failed

## Content Processing Endpoints

### Render Content

#### POST `/content/render`

Render web content (markdown, HTML, text).

**Request Body**:
```json
{
  "content": "# Hello World\n\nThis is **markdown** content.",
  "type": "markdown",
  "options": {
    "enableSyntaxHighlighting": true,
    "enableMath": false,
    "enableTables": true,
    "customCss": ".custom { color: red; }",
    "sanitizeHtml": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "cacheKey": "rendered-cache-key",
    "renderedContent": "<div class=\"markdown-content\">...</div>",
    "type": "markdown",
    "metadata": {
      "wordCount": 25,
      "readingTime": 1,
      "headings": ["Hello World"],
      "links": [],
      "images": []
    },
    "processingTime": 150,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Invalid input
- `500`: Rendering failed

### Process PDF

#### POST `/content/pdf`

Process PDF files for text extraction and metadata.

**Request Body**:
```json
{
  "url": "https://example.com/document.pdf",
  "content": "base64-encoded-pdf-content",
  "extractText": true,
  "extractImages": true,
  "pageNumbers": [1, 2, 3]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pdfId": "uuid-pdf-id",
    "url": "https://example.com/document.pdf",
    "metadata": {
      "title": "Sample PDF Document",
      "author": "Unknown",
      "pageCount": 25,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "fileSize": 2048000
    },
    "text": "This is the extracted text content from the PDF...",
    "images": [
      {
        "page": 1,
        "index": 1,
        "data": "base64_encoded_image_data",
        "format": "png"
      }
    ],
    "pages": [1, 2, 3],
    "processingTime": 2000,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Invalid input
- `503`: PDF processing disabled
- `500`: PDF processing failed

### Process EPUB

#### POST `/content/epub`

Process EPUB files for content extraction and metadata.

**Request Body**:
```json
{
  "url": "https://example.com/book.epub",
  "content": "base64-encoded-epub-content",
  "extractText": true,
  "extractMetadata": true,
  "chapterNumbers": [1, 2]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "epubId": "uuid-epub-id",
    "url": "https://example.com/book.epub",
    "metadata": {
      "title": "Sample EPUB Book",
      "author": "Unknown Author",
      "language": "en",
      "publisher": "Unknown Publisher",
      "publishedAt": "2024-01-01",
      "isbn": "1234567890",
      "wordCount": 50000,
      "estimatedReadingTime": 250
    },
    "chapters": [
      {
        "id": "chapter-1",
        "title": "Chapter 1: Introduction",
        "content": "This is the content of chapter 1...",
        "wordCount": 5000
      }
    ],
    "tableOfContents": [
      {
        "id": "chapter-1",
        "title": "Chapter 1: Introduction",
        "page": 1
      }
    ],
    "processingTime": 1500,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Invalid input
- `503`: EPUB processing disabled
- `500`: EPUB processing failed

### Retrieve Cached Content

#### GET `/content/:cacheKey`

Retrieve previously cached content.

**Response**:
```json
{
  "success": true,
  "data": {
    // Original cached content plus access timestamp
    "accessedAt": "2024-01-01T12:05:00.000Z"
  }
}
```

**Error Responses**:
- `404`: Content not found or expired
- `403`: Access denied
- `500`: Retrieval failed

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Unauthenticated users**: 100 requests per hour
- **Authenticated users**: 1000 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704097200
Retry-After: 3600
```

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "recoverable": true,
    "userMessage": "User-friendly error message",
    "details": {
      "additional": "error context"
    }
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Authentication required | 401 |
| `INVALID_TOKEN` | Invalid or expired token | 401 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `NO_ACTIVE_SESSION` | No browser session found | 404 |
| `ACCESS_DENIED` | Permission denied | 403 |
| `NAVIGATION_FAILED` | Failed to navigate | 500 |
| `CONTENT_NOT_FOUND` | Cached content not found | 404 |
| `PDF_PROCESSING_DISABLED` | PDF processing disabled | 503 |
| `EPUB_PROCESSING_DISABLED` | EPUB processing disabled | 503 |

## Integration Examples

### JavaScript/TypeScript Client

```typescript
class WebBrowserClient {
  constructor(
    private baseUrl: string,
    private authToken: string,
    private sessionId?: string
  ) {}

  async navigate(url: string, options?: any) {
    const response = await fetch(`${this.baseUrl}/browser/navigate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, ...options }),
    });

    const result = await response.json();
    if (result.success) {
      this.sessionId = result.data.sessionId;
    }
    return result;
  }

  async screenshot(options?: any) {
    if (!this.sessionId) {
      throw new Error('No active session. Call navigate() first.');
    }

    const response = await fetch(`${this.baseUrl}/browser/screenshot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        'X-Browser-Session': this.sessionId,
      },
      body: JSON.stringify(options || {}),
    });

    return response.json();
  }

  async renderContent(content: string, type: 'markdown' | 'html' | 'text') {
    const response = await fetch(`${this.baseUrl}/content/render`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, type }),
    });

    return response.json();
  }
}

// Usage
const client = new WebBrowserClient(
  'https://your-domain.com/api/web-browser',
  'your-jwt-token'
);

await client.navigate('https://example.com');
const screenshot = await client.screenshot({ format: 'png' });
const rendered = await client.renderContent('# Hello', 'markdown');
```

### cURL Examples

```bash
# Navigate to URL
curl -X POST https://your-domain.com/api/web-browser/browser/navigate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Take screenshot
curl -X POST https://your-domain.com/api/web-browser/browser/screenshot \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Browser-Session: YOUR_SESSION_ID" \
  -d '{"format": "png", "fullPage": true}'

# Render markdown
curl -X POST https://your-domain.com/api/web-browser/content/render \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "# Hello World", "type": "markdown"}'
```

### React Integration

```typescript
import React, { useState, useEffect } from 'react';

function BrowserViewer({ url, token }: { url: string; token: string }) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function takeScreenshot() {
      setLoading(true);
      try {
        // First navigate
        const navResponse = await fetch('/api/web-browser/browser/navigate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        const navResult = await navResponse.json();
        if (navResult.success) {
          // Then take screenshot
          const screenResponse = await fetch('/api/web-browser/browser/screenshot', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'X-Browser-Session': navResult.data.sessionId,
            },
            body: JSON.stringify({ format: 'png' }),
          });

          const screenResult = await screenResponse.json();
          if (screenResult.success) {
            setScreenshot(screenResult.data.data);
          }
        }
      } catch (error) {
        console.error('Browser operation failed:', error);
      } finally {
        setLoading(false);
      }
    }

    if (url) {
      takeScreenshot();
    }
  }, [url, token]);

  return (
    <div className="browser-viewer">
      {loading && <div>Loading...</div>}
      {screenshot && (
        <img src={screenshot} alt="Browser screenshot" />
      )}
    </div>
  );
}
```

## Deployment

### Cloudflare Workers

1. Install Wrangler:
```bash
npm install -g wrangler
```

2. Configure environment variables in `wrangler.toml`

3. Deploy:
```bash
wrangler deploy --config packages/web-browser/api/wrangler.toml
```

### Docker (Alternative)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY packages/web-browser/api ./
RUN npm install

EXPOSE 8080
CMD ["node", "index.js"]
```

## Monitoring and Logging

### Request Logging

All API requests are logged with:
- Request method and path
- Response status code
- Processing time
- User identifier (if authenticated)
- Error details (if any)

### Health Monitoring

Monitor the `/health` endpoint for:
- API availability
- Service status
- Configuration changes
- Performance metrics

### Metrics

Track these key metrics:
- Request rate per endpoint
- Error rates and types
- Response times
- Active browser sessions
- Content processing times

## Security Considerations

### Authentication

- JWT tokens are validated on every request
- Tokens expire after configured time (default: 1 hour)
- Refresh tokens are supported for extended sessions

### Content Security

- HTML content is sanitized when rendering
- File uploads are validated for type and size
- JavaScript execution is sandboxed

### Rate Limiting

- Per-user and per-IP rate limiting
- Configurable limits and time windows
- Automatic throttling for abusive requests

### Data Privacy

- Session data is automatically expired
- Cached content has limited TTL
- No persistent storage of sensitive data

## Support

For issues, questions, or feature requests:

1. Check the [GitHub Issues](https://github.com/TaskWizer/app-builder/issues)
2. Review the [Architecture Documentation](../../architecture/monorepo.md)
3. Contact the development team

## Changelog

### Version 1.0.0
- Initial release
- Browser automation endpoints
- Content processing endpoints
- Authentication and rate limiting
- Cloudflare Workers deployment