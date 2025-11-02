import express from 'express';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://taskwizer.com'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'taskwizer-web-browser-api',
    version: '1.0.0'
  });
});

// Proxy middleware for external services
app.use('/api/proxy', createProxyMiddleware({
  target: 'https://r.jina.ai',
  changeOrigin: true,
  pathRewrite: {
    '^/api/proxy': '',
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add user agent to make requests look like they come from a browser
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({
      success: false,
      error: 'Proxy request failed',
      details: err.message
    });
  }
}));

// Gemini API proxy
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt, model = 'models/gemma-3-27b-it' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key not configured'
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      data: {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        model,
        usage: data.usageMetadata
      }
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

// Browser automation endpoints (placeholder for future implementation)
app.post('/api/browser/navigate', async (req, res) => {
  try {
    const { url } = req.body;

    // For now, just validate the URL and return a success response
    // In a full implementation, this would control a headless browser
    if (!url || !url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    res.json({
      success: true,
      data: {
        url,
        status: 'navigated',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Navigate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to navigate',
      details: error.message
    });
  }
});

// Content rendering endpoint
app.post('/api/content/render', async (req, res) => {
  try {
    const { content, type = 'markdown' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    // For now, just return the content as-is
    // In a full implementation, this would render markdown, HTML, etc.
    res.json({
      success: true,
      data: {
        rendered: content,
        type,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to render content',
      details: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TaskWizer Web Browser API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});