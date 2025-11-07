# Testing Guide

This document outlines the testing infrastructure setup for the TaskWizer Web Browser project.

## Test Structure

### Unit Tests
- **Location**: `src/test/` and `src/services/`
- **Runner**: Vitest
- **Environment**: jsdom with React Testing Library

### E2E Tests
- **Location**: `e2e/`
- **Runner**: Playwright
- **Coverage**: Critical user flows and cross-browser compatibility

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:dev

# Run tests with UI
npm run test:ui

# Run tests once with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Install Playwright browsers (first time only)
npm run test:e2e:install

# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Test Configuration

### Vitest Configuration
- Config file: `vitest.config.ts`
- Global setup: `src/test/setup.ts`
- Test utilities: `src/test/utils.tsx`

### Playwright Configuration
- Config file: `playwright.config.ts`
- Supports: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Base URL: `http://localhost:3003`
- Automatic dev server startup

## Current Test Coverage

### ✅ Implemented
- Basic test setup and configuration
- Global mocks (fetch, matchMedia, ResizeObserver, IntersectionObserver)
- Proxy service unit tests
- Environment variable handling tests
- Test utilities and helpers

### 🚧 In Progress
- Component unit tests (AddressBar, TabBar, BrowserView)
- Service layer tests (Gemini, content handling)
- E2E test scenarios

### 📋 Planned
- Full component coverage
- Integration tests
- Performance tests
- Accessibility tests

## Writing New Tests

### Unit Test Example
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test'

test('user can navigate', async ({ page }) => {
  await page.goto('/')
  await page.fill('[data-testid="address-bar"]', 'https://example.com')
  await page.press('[data-testid="address-bar"]', 'Enter')
  await expect(page).toHaveURL(/example/)
})
```

## Testing Best Practices

1. **Test user behavior, not implementation details**
2. **Use meaningful test names that describe the behavior**
3. **Mock external dependencies (APIs, timers, etc.)**
4. **Keep tests simple and focused**
5. **Use data-testid attributes for test selectors**
6. **Test error states and edge cases**
7. **Maintain good test coverage (>80%)**

## Troubleshooting

### Common Issues
- **Import errors**: Check file paths and alias configuration
- **Mock failures**: Ensure mocks are properly set up in setup.ts
- **Timeout errors**: Increase timeout values for async operations
- **Flaky tests**: Add proper waits and avoid race conditions

### Debug Mode
```bash
# Run tests in debug mode
npm run test -- --inspect-brk

# Run specific test file
npm run test src/path/to/test.test.ts
```