import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContentRenderer } from '../../components/ContentRenderer';

describe('ContentRenderer Security Tests', () => {
  describe('XSS Protection', () => {
    it('should sanitize HTML with script tags', () => {
      const maliciousContent = '<script>alert("XSS")</script><p>Safe content</p>';
      render(<ContentRenderer content={maliciousContent} type="html" />);

      // Script tag should be removed
      expect(document.querySelector('script')).not.toBeInTheDocument();
      // Safe content should remain
      expect(screen.getByText('Safe content')).toBeInTheDocument();
    });

    it('should remove inline event handlers', () => {
      const maliciousContent = '<div onclick="alert(\'XSS\')" onmouseover="malicious()">Click me</div>';
      render(<ContentRenderer content={maliciousContent} type="html" />);

      const div = document.querySelector('div');
      expect(div).not.toHaveAttribute('onclick');
      expect(div).not.toHaveAttribute('onmouseover');
      expect(div).toHaveTextContent('Click me');
    });

    it('should block javascript: protocol in URLs', () => {
      const maliciousContent = '<a href="javascript:alert(\'XSS\')">Malicious link</a>';
      render(<ContentRenderer content={maliciousContent} type="html" />);

      const link = screen.getByRole('link', { name: 'Malicious link' });
      expect(link).not.toHaveAttribute('href', 'javascript:alert(\'XSS\')');
    });

    it('should allow safe HTML tags and attributes', () => {
      const safeContent = `
        <h1>Safe Title</h1>
        <p>Safe paragraph with <strong>bold</strong> text</p>
        <a href="https://example.com" target="_blank" rel="noopener noreferrer">Safe link</a>
        <img src="https://example.com/image.jpg" alt="Safe image" />
      `;
      render(<ContentRenderer content={safeContent} type="html" />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Safe Title');
      expect(screen.getByText(/Safe paragraph with/)).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Safe link' })).toHaveAttribute('href', 'https://example.com');
      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Safe image');
    });

    it('should escape HTML in markdown content', () => {
      const markdownWithHtml = '# Title\n<p>This contains <script>alert("XSS")</script> HTML</p>';
      render(<ContentRenderer content={markdownWithHtml} type="markdown" />);

      // HTML should be escaped, not rendered
      expect(screen.queryByText('This contains')).not.toBeInTheDocument();
      expect(screen.getByText(/# Title/)).toBeInTheDocument();
      expect(screen.getByText(/<script>alert\("XSS"\)<\/script>/)).toBeInTheDocument();
    });

    it('should render text content safely', () => {
      const textContent = 'Plain text with <html> tags that should be shown as-is';
      render(<ContentRenderer content={textContent} type="text" />);

      expect(screen.getByText(textContent)).toBeInTheDocument();
    });
  });

  describe('Content Type Handling', () => {
    it('should apply correct CSS classes for different content types', () => {
      const { container, rerender } = render(<ContentRenderer content="<p>test</p>" type="html" />);
      expect(container.querySelector('.content-renderer')).toBeInTheDocument();

      rerender(<ContentRenderer content="# Test" type="markdown" />);
      expect(container.querySelector('.prose')).toBeInTheDocument();

      rerender(<ContentRenderer content="plain text" type="text" />);
      expect(container.querySelector('pre')).toBeInTheDocument();
    });

    it('should handle empty content gracefully', () => {
      render(<ContentRenderer content="" type="html" />);
      expect(screen.getByText('')).toBeInTheDocument();
    });

    it('should handle null/undefined content', () => {
      const { container } = render(<ContentRenderer content={null} type="html" />);
      expect(container.querySelector('.content-renderer')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to wrapper', () => {
      const { container } = render(
        <ContentRenderer content="<p>test</p>" type="html" className="custom-class" />
      );
      expect(container.querySelector('.content-renderer.custom-class')).toBeInTheDocument();
    });
  });
});