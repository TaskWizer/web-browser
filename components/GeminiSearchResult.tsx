
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { GeminiSearchResult as GeminiSearchResultType } from '../types';
import { ICONS } from '../constants';

interface GeminiSearchResultProps {
  result: GeminiSearchResultType;
  isStreaming?: boolean;
  onSearch?: (query: string) => void;
}


export const GeminiSearchResult: React.FC<GeminiSearchResultProps> = ({ result, isStreaming = false, onSearch }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="bg-zinc-900 text-white p-6 sm:p-8 md:p-12 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <p className="text-zinc-400 text-sm mb-2">Search query</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100">{result.query}</h1>
        </div>

        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-indigo-500/10 to-zinc-800/10 rounded-lg border border-zinc-700/50">
          <div className="flex-shrink-0 text-indigo-400 mt-1">{ICONS.SPARKLES}</div>
          <div className="flex-grow">
            <h2 className="text-lg font-semibold text-indigo-400 mb-4">AI Answer</h2>
            <div className="markdown-content">
              <style>{`
                /* Highlight.js VS Code Dark+ theme styles */
                .hljs {
                  background: #18181b !important;
                  color: #d4d4d4 !important;
                  padding: 1rem !important;
                  border-radius: 0.5rem !important;
                  font-size: 0.875rem !important;
                  line-height: 1.5 !important;
                  overflow-x: auto !important;
                }
                .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section, .hljs-link { color: #569cd6; }
                .hljs-function, .hljs-params { color: #dcdcaa; }
                .hljs-string, .hljs-title, .hljs-name, .hljs-type { color: #ce9178; }
                .hljs-number, .hljs-symbol, .hljs-bullet { color: #b5cea8; }
                .hljs-comment, .hljs-quote { color: #6a9955; font-style: italic; }
                .hljs-variable, .hljs-template-variable, .hljs-tag, .hljs-attr { color: #9cdcfe; }
                .hljs-built_in, .hljs-builtin-name { color: #4ec9b0; }
                .hljs-meta, .hljs-meta-keyword { color: #c586c0; }
                .hljs-emphasis { font-style: italic; }
                .hljs-strong { font-weight: bold; }
              `}</style>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  // Code blocks with copy button
                  pre: ({ children, ...props }: any) => {
                    const codeElement = children?.props?.children;
                    const codeString = typeof codeElement === 'string' ? codeElement : String(codeElement || '');

                    return (
                      <div className="relative group my-4">
                        <button
                          onClick={() => copyToClipboard(codeString)}
                          className="absolute top-2 right-2 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          {copiedCode === codeString ? '✓ Copied!' : 'Copy'}
                        </button>
                        <pre {...props}>{children}</pre>
                      </div>
                    );
                  },
                  // Inline code
                  code: ({ inline, children, ...props }: any) => {
                    if (inline) {
                      return (
                        <code className="bg-zinc-800 text-indigo-300 rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return <code {...props}>{children}</code>;
                  },
                  // Headings
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-zinc-50 mt-8 mb-4 first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-zinc-100 mt-6 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-zinc-200 mt-5 mb-2">{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-semibold text-zinc-300 mt-4 mb-2">{children}</h4>
                  ),
                  h5: ({ children }) => (
                    <h5 className="text-base font-semibold text-zinc-300 mt-3 mb-2">{children}</h5>
                  ),
                  h6: ({ children }) => (
                    <h6 className="text-sm font-semibold text-zinc-400 mt-3 mb-2">{children}</h6>
                  ),
                  // Paragraphs
                  p: ({ children }) => (
                    <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>
                  ),
                  // Lists
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-zinc-300">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-zinc-300">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  // Blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 my-4 italic text-zinc-400 bg-zinc-800/50 rounded-r">
                      {children}
                    </blockquote>
                  ),
                  // Links
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 underline hover:no-underline transition-colors"
                    >
                      {children}
                    </a>
                  ),
                  // Tables
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border border-zinc-700 rounded-lg overflow-hidden">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-zinc-800">{children}</thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-zinc-700">{children}</tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="even:bg-zinc-800/50">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-200 border-r border-zinc-700 last:border-r-0">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 text-sm text-zinc-300 border-r border-zinc-700 last:border-r-0">
                      {children}
                    </td>
                  ),
                  // Horizontal rule
                  hr: () => (
                    <hr className="my-6 border-t border-zinc-700" />
                  ),
                  // Strong/Bold
                  strong: ({ children }) => (
                    <strong className="font-bold text-zinc-100">{children}</strong>
                  ),
                  // Emphasis/Italic
                  em: ({ children }) => (
                    <em className="italic text-zinc-300">{children}</em>
                  ),
                  // Strikethrough
                  del: ({ children }) => (
                    <del className="line-through text-zinc-500">{children}</del>
                  ),
                }}
              >
                {result.answer}
              </ReactMarkdown>
            </div>
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-indigo-400 ml-1 animate-pulse" style={{ animation: 'blink 1s infinite' }}>
                <style>{`
                  @keyframes blink {
                    0%, 49% { opacity: 1; }
                    50%, 100% { opacity: 0; }
                  }
                `}</style>
              </span>
            )}

            {/* Suggested Prompts Section */}
            {!isStreaming && result.suggestedPrompts && result.suggestedPrompts.length > 0 && onSearch && (
              <div className="mt-6 pt-6 border-t border-zinc-700/50">
                <h3 className="text-sm font-semibold text-zinc-400 mb-3">Suggested follow-up questions:</h3>
                <div className="flex flex-wrap gap-2">
                  {result.suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSearch(prompt)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-full transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
