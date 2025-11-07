import React from 'react';
import DOMPurify from 'dompurify';

export interface ContentRendererProps {
  content: string;
  type: 'html' | 'markdown' | 'text';
  className?: string;
}

export function ContentRenderer({ content, type, className = '' }: ContentRendererProps) {
  const renderContent = () => {
    switch (type) {
      case 'html': {
        // Sanitize HTML content to prevent XSS attacks
        const cleanHTML = DOMPurify.sanitize(content, {
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
          ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
          FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea', 'button', 'select', 'meta', 'link', 'style'],
          FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeyup', 'onkeypress'],
          SANITIZE_DOM: true,
          SANITIZE_NAMED_PROPS: true,
          WHOLE_DOCUMENT: false,
          RETURN_DOM: false,
          RETURN_DOM_FRAGMENT: false,
          RETURN_DOM_IMPORT: false
        });
        return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
      }
      case 'markdown': {
        // For markdown, we'll escape HTML tags and render as text for now
        // In a full implementation, you'd use a markdown parser like marked or remark
        const escapedContent = content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        return <div className="prose prose-sm max-w-none whitespace-pre-wrap">{escapedContent}</div>;
      }
      case 'text':
        return <pre className="whitespace-pre-wrap">{content}</pre>;
      default:
        return <div>{content}</div>;
    }
  };

  return (
    <div className={`content-renderer ${className}`}>
      {renderContent()}
    </div>
  );
}