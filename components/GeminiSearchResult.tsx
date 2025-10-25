
import React from 'react';
import type { GeminiSearchResult as GeminiSearchResultType } from '../types';
import { ICONS } from '../constants';

interface GeminiSearchResultProps {
  result: GeminiSearchResultType;
}

// Basic markdown-to-HTML conversion
const renderMarkdown = (text: string) => {
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
        .replace(/`([^`]+)`/g, '<code class="bg-zinc-700 rounded px-1 py-0.5 text-sm">$1</code>') // Inline code
        .replace(/^### (.*$)/g, '<h3>$1</h3>') // H3
        .replace(/^## (.*$)/g, '<h2>$1</h2>') // H2
        .replace(/^# (.*$)/g, '<h1>$1</h1>') // H1
        .replace(/^\* (.*$)/g, '<ul><li>$1</li></ul>') // Lists
        .replace(/\n/g, '<br />'); // Newlines

    // Collapse multiple <ul> tags
    html = html.replace(/<\/ul><br \/><ul>/g, '');

    return { __html: html };
};


export const GeminiSearchResult: React.FC<GeminiSearchResultProps> = ({ result }) => {
  return (
    <div className="bg-zinc-900 text-white p-6 sm:p-8 md:p-12 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <p className="text-zinc-400 text-sm mb-2">Search query</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100">{result.query}</h1>
        </div>
        
        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-indigo-500/10 to-zinc-800/10 rounded-lg border border-zinc-700/50">
          <div className="flex-shrink-0 text-indigo-400 mt-1">{ICONS.SPARKLES}</div>
          <div>
            <h2 className="text-lg font-semibold text-indigo-400 mb-4">AI Answer</h2>
            <div 
              className="prose prose-invert prose-p:text-zinc-300 prose-strong:text-zinc-100 prose-h1:text-zinc-50 prose-h2:text-zinc-100 prose-h3:text-zinc-200 prose-code:text-indigo-300 leading-relaxed"
              dangerouslySetInnerHTML={renderMarkdown(result.answer)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
