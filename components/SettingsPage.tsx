import React from 'react';

interface SettingsPageProps {
  onNavigate: (url: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-zinc-900 text-white p-6 sm:p-8 md:p-12 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <div className="space-y-6">
          <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
            <h2 className="text-xl font-semibold mb-4">Search Provider</h2>
            <p className="text-zinc-400 mb-4">Select the default search engine for the address bar.</p>
            <select className="w-full max-w-xs px-4 py-2 bg-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="google">Google</option>
              <option value="duckduckgo" disabled>DuckDuckGo (coming soon)</option>
              <option value="bing" disabled>Bing (coming soon)</option>
            </select>
          </div>
          {/* More settings can be added here */}
        </div>
      </div>
    </div>
  );
};