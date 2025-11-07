import { describe, it, expect, vi, beforeEach } from 'vitest'

// Simple tests to verify our setup works
describe('Basic Test Setup', () => {
  it('should run a basic test', () => {
    expect(true).toBe(true)
  })

  it('should mock functions correctly', () => {
    const mockFn = vi.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
  })

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test')
    expect(result).toBe('test')
  })
})

describe('Environment Variables', () => {
  it('should stub environment variables', () => {
    vi.stubEnv('TEST_VAR', 'test_value')
    expect(import.meta.env.TEST_VAR).toBe('test_value')
  })
})

describe('Global Mocks', () => {
  it('should have mocked fetch', () => {
    expect(global.fetch).toBeDefined()
    expect(typeof global.fetch).toBe('function')
  })

  it('should have mocked matchMedia', () => {
    expect(window.matchMedia).toBeDefined()
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    expect(mediaQuery).toHaveProperty('matches')
  })

  it('should have mocked ResizeObserver', () => {
    expect(global.ResizeObserver).toBeDefined()
    expect(typeof global.ResizeObserver).toBe('function')
  })
})