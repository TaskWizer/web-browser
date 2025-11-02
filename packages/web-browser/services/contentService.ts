export interface ContentService {
  renderContent(content: string, type: 'html' | 'markdown' | 'text'): Promise<string>;
  extractText(content: string): Promise<string>;
}

export class ContentServiceImpl implements ContentService {
  async renderContent(content: string, type: 'html' | 'markdown' | 'text'): Promise<string> {
    // Placeholder implementation
    switch (type) {
      case 'html':
        return content;
      case 'markdown':
        return `<div class="markdown">${content}</div>`;
      case 'text':
        return `<pre>${content}</pre>`;
      default:
        return content;
    }
  }

  async extractText(content: string): Promise<string> {
    // Placeholder implementation
    return content.replace(/<[^>]*>/g, '');
  }
}