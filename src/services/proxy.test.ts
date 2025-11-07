import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canUseDirectIframe } from '../../services/proxyService'

describe('proxyService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('canUseDirectIframe', () => {
    it('returns true for allowed domains', () => {
      expect(canUseDirectIframe('https://en.wikipedia.org/wiki/Test')).toBe(true)
      expect(canUseDirectIframe('https://www.wikipedia.org/wiki/Test')).toBe(true)
      expect(canUseDirectIframe('https://youtube.com/watch?v=test')).toBe(true)
      expect(canUseDirectIframe('https://www.youtube.com/watch?v=test')).toBe(true)
      expect(canUseDirectIframe('https://vimeo.com/123456789')).toBe(true)
      expect(canUseDirectIframe('https://codepen.io/test/pen/test')).toBe(true)
    })

    it('returns false for localhost URLs', () => {
      expect(canUseDirectIframe('http://localhost:3000')).toBe(false)
      expect(canUseDirectIframe('https://localhost:8080')).toBe(false)
      expect(canUseDirectIframe('http://127.0.0.1:3000')).toBe(false)
    })

    it('returns false for file:// URLs', () => {
      expect(canUseDirectIframe('file:///path/to/file.html')).toBe(false)
    })

    it('returns false for data: URLs', () => {
      expect(canUseDirectIframe('data:text/html,<html></html>')).toBe(false)
    })

    it('returns false for external HTTPS URLs not in allowed list', () => {
      expect(canUseDirectIframe('https://example.com')).toBe(false)
      expect(canUseDirectIframe('https://google.com')).toBe(false)
      expect(canUseDirectIframe('https://github.com')).toBe(false)
    })

    it('returns false for external HTTP URLs', () => {
      expect(canUseDirectIframe('http://example.com')).toBe(false)
      expect(canUseDirectIframe('http://google.com')).toBe(false)
    })

    it('returns false for malformed URLs', () => {
      expect(canUseDirectIframe('not-a-url')).toBe(false)
      expect(canUseDirectIframe('')).toBe(false)
    })
  })
})