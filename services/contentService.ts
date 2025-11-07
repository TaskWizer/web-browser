import DOMPurify from 'dompurify';

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
      // Use DOMPurify for comprehensive HTML sanitization to prevent XSS
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'strong', 'em', 'u', 'i', 'b',
          'ul', 'ol', 'li', 'dl', 'dt', 'dd',
          'blockquote', 'pre', 'code',
          'a', 'img',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span', 'section', 'article', 'header', 'footer',
          'hr'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
        FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea', 'button', 'select', 'meta', 'link', 'style'],
        FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeyup', 'onkeypress'],
        SANITIZE_DOM: true,
        SANITIZE_NAMED_PROPS: true,
        WHOLE_DOCUMENT: false,
        RETURN_DOM: false
      });
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