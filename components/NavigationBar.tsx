import React from 'react';

export interface NavigationBarProps {
  title?: string;
  onNavigate?: (path: string) => void;
}

export function NavigationBar({ title = 'Web Browser', onNavigate }: NavigationBarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => onNavigate?.('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            Home
          </button>
        </div>
      </div>
    </nav>
  );
}