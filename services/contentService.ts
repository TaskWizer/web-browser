export interface ContentService {
  renderContent(content: string, type: 'html' | 'markdown' | 'text'): Promise<string>;
  extractText(content: string): Promise<string>;
  sanitizeHTML(html: string): string;
}

export class ContentServiceImpl implements ContentService {
  async renderContent(content: string, type: 'html' | 'markdown' | 'text'): Promise<string> {
    try {
      switch (type) {
        case 'html':
          return this.sanitizeHTML(content);

        case 'markdown':
          // Basic markdown to HTML conversion
          const html = this.convertMarkdownToHTML(content);
          return `<div class="markdown-content">${html}</div>`;

        case 'text':
          // Convert plain text to HTML with proper formatting
          const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
          return `<div class="text-content">${escaped.replace(/\n/g, '<br>')}</div>`;

        default:
          return this.sanitizeHTML(content);
      }
    } catch (error) {
      console.error('[ContentService] Error rendering content:', error);
      return `<div class="error-content">Error rendering content: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
    }
  }

  async extractText(content: string): Promise<string> {
    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // Get text content while preserving line breaks from certain elements
      const text = tempDiv.textContent || tempDiv.innerText || '';

      // Clean up whitespace
      return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('[ContentService] Error extracting text:', error);
      // Fallback to basic regex removal
      return content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  }

  sanitizeHTML(html: string): string {
    try {
      // Basic HTML sanitization to prevent XSS
      let sanitized = html;

      // Remove dangerous attributes and protocols
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
      sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
      sanitized = sanitized.replace(/(?:href|src|action|formaction)\s*=\s*["']javascript:[^"']*["']/gi, '');
      sanitized = sanitized.replace(/(?:href|src|action|formaction)\s*=\s*javascript:[^\s>]*/gi, '');

      // Remove potentially dangerous tags
      const dangerousTags = ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea'];
      dangerousTags.forEach(tag => {
        const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
        sanitized = sanitized.replace(regex, '');
      });

      // Remove meta tags that could be used for injection
      sanitized = sanitized.replace(/<meta[^>]*>/gi, '');

      return sanitized;
    } catch (error) {
      console.error('[ContentService] Error sanitizing HTML:', error);
      return `<div class="sanitized-content">HTML could not be sanitized</div>`;
    }
  }

  private convertMarkdownToHTML(markdown: string): string {
    // Basic markdown conversion (for production, consider using a proper markdown library)
    let html = markdown;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Code blocks
    html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraphs
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }

    return html;
  }
}