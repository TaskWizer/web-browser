// Mock implementation of @taskwizer/shared for standalone deployments
// This provides basic functionality when the shared package is not available

export const createApiResponse = (data: any, status = 200) => ({
  success: true,
  data,
  status,
  timestamp: new Date().toISOString()
});

export const createApiError = (
  code: string = 'UNKNOWN_ERROR',
  message: string = 'An unknown error occurred',
  success: boolean = false,
  details?: string,
  metadata?: any
) => ({
  success,
  error: {
    code,
    message,
    details,
    metadata
  },
  timestamp: new Date().toISOString()
});

export const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  DEFAULT_LIMIT: 100,
  AUTHENTICATED_LIMIT: 1000,
  DEFAULT_WINDOW: 15 * 60 * 1000, // 15 minutes
  AUTHENTICATED_WINDOW: 15 * 60 * 1000 // 15 minutes
};

// Basic auth mock for standalone mode
export const createAuthService = () => ({
  authenticate: (token: string) => {
    // In standalone mode, just check if token exists
    return Promise.resolve(!!token);
  },
  authorize: (user: any, resource: string) => {
    // In standalone mode, allow everything
    return Promise.resolve(true);
  }
});

// Constants
export const API_CONFIG = {
  version: '1.0.0',
  name: 'TaskWizer Web Browser'
};