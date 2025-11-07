import { describe, it, expect } from 'vitest';
import { ContentServiceImpl } from '../../services/contentService';

describe('ContentService Security Tests', () => {
  let contentService: ContentServiceImpl;

  beforeEach(() => {
    contentService = new ContentServiceImpl();
  });

  describe('HTML Sanitization', () => {
    it('should remove script tags', () => {
      const maliciousHtml = '<script>alert("XSS")</script><p>Safe content</p>';
      const sanitized = contentService.sanitizeHTML(maliciousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert("XSS")');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should remove event handlers', () => {
      const maliciousHtml = '<div onclick="alert(1)" onmouseover="malicious()">Content</div>';
      const sanitized = contentService.sanitizeHTML(maliciousHtml);

      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('onmouseover');
      expect(sanitized).toContain('Content');
    });

    it('should remove dangerous tags', () => {
      const dangerousHtml = `
        <script>alert(1)</script>
        <iframe src="javascript:alert(1)"></iframe>
        <object data="malicious.swf"></object>
        <embed src="malicious.swf"></embed>
        <form action="javascript:alert(1)"><input type="submit"></form>
        <p>Safe content</p>
      `;
      const sanitized = contentService.sanitizeHTML(dangerousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).not.toContain('<object>');
      expect(sanitized).not.toContain('<embed>');
      expect(sanitized).not.toContain('<form>');
      expect(sanitized).not.toContain('<input>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should allow safe tags and attributes', () => {
      const safeHtml = `
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em> text</p>
        <a href="https://example.com" title="Example">Link</a>
        <img src="https://example.com/img.jpg" alt="Image" />
        <ul><li>List item</li></ul>
        <table><tr><td>Cell</td></tr></table>
      `;
      const sanitized = contentService.sanitizeHTML(safeHtml);

      expect(sanitized).toContain('<h1>Title</h1>');
      expect(sanitized).toContain('<strong>bold</strong>');
      expect(sanitized).toContain('<em>italic</em>');
      expect(sanitized).toContain('href="https://example.com"');
      expect(sanitized).toContain('alt="Image"');
      expect(sanitized).toContain('<ul>');
      expect(sanitized).toContain('<table>');
    });

    it('should block javascript: URLs', () => {
      const maliciousHtml = '<a href="javascript:alert(1)">Malicious link</a>';
      const sanitized = contentService.sanitizeHTML(maliciousHtml);

      expect(sanitized).not.toContain('javascript:alert(1)');
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<div><p>Unclosed tags<script>alert(1)';
      const sanitized = contentService.sanitizeHTML(malformedHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<div>');
      expect(sanitized).toContain('<p>');
    });

    it('should handle empty content', () => {
      const sanitized = contentService.sanitizeHTML('');
      expect(sanitized).toBe('');
    });

    it('should handle null/undefined input', () => {
      expect(() => {
        contentService.sanitizeHTML(null as any);
      }).not.toThrow();

      expect(() => {
        contentService.sanitizeHTML(undefined as any);
      }).not.toThrow();
    });
  });

  describe('Content Rendering', () => {
    it('should render HTML content with sanitization', async () => {
      const content = '<script>alert(1)</script><p>Safe content</p>';
      const rendered = await contentService.renderContent(content, 'html');

      expect(rendered).not.toContain('<script>');
      expect(rendered).toContain('<p>Safe content</p>');
    });

    it('should escape HTML in markdown rendering', async () => {
      const markdown = '# Title\n<p>This contains <script>alert(1)</script></p>';
      const rendered = await contentService.renderContent(markdown, 'markdown');

      expect(rendered).toContain('<h1>Title</h1>');
      expect(rendered).not.toContain('<script>');
      expect(rendered).not.toContain('<p>This contains');
    });

    it('should escape HTML entities in text rendering', async () => {
      const text = '<script>alert(1)</script> & "quotes"';
      const rendered = await contentService.renderContent(text, 'text');

      expect(rendered).toContain('&lt;script&gt;');
      expect(rendered).toContain('&amp;');
      expect(rendered).toContain('&quot;');
    });

    it('should handle rendering errors gracefully', async () => {
      const result = await contentService.renderContent(null as any, 'html');
      expect(result).toContain('Error rendering content');
    });
  });

  describe('Text Extraction', () => {
    it('should extract text from HTML', async () => {
      const html = '<h1>Title</h1><p>Paragraph <strong>with</strong> formatting</p>';
      const text = await contentService.extractText(html);

      expect(text).toContain('Title');
      expect(text).toContain('Paragraph');
      expect(text).toContain('with');
      expect(text).toContain('formatting');
      expect(text).not.toContain('<h1>');
      expect(text).not.toContain('<strong>');
    });

    it('should handle complex HTML structure', async () => {
      const html = `
        <html>
          <head><title>Page Title</title></head>
          <body>
            <nav>Navigation</nav>
            <main>
              <article>
                <h1>Main Title</h1>
                <p>Content here</p>
              </article>
            </main>
            <footer>Footer content</footer>
          </body>
        </html>
      `;
      const text = await contentService.extractText(html);

      expect(text).toContain('Page Title');
      expect(text).toContain('Navigation');
      expect(text).toContain('Main Title');
      expect(text).toContain('Content here');
      expect(text).toContain('Footer content');
    });

    it('should handle extraction errors', async () => {
      const result = await contentService.extractText(null as any);
      expect(result).toBe('');
    });
  });
});