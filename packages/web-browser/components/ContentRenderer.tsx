import React from 'react';

export interface ContentRendererProps {
  content: string;
  type: 'html' | 'markdown' | 'text';
  className?: string;
}

export function ContentRenderer({ content, type, className = '' }: ContentRendererProps) {
  const renderContent = () => {
    switch (type) {
      case 'html':
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
      case 'markdown':
        return <div className="prose prose-sm max-w-none">{content}</div>;
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