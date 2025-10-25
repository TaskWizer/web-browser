import React from 'react';
import { ICONS } from '../constants';

interface NewTabPageProps {
  onSearch: (query: string) => void;
}

const inspirationalPrompts = [
    "What's the Drake Equation and what does it mean?",
    "Explain the concept of quantum entanglement like I'm five.",
    "Tell me a short story about a robot who discovers music.",
    "What are some recent breakthroughs in battery technology?",
    "How do black holes form?"
];

export const NewTabPage: React.FC<NewTabPageProps> = ({ onSearch }) => {

  const handleInspireMe = async () => {
    const randomPrompt = inspirationalPrompts[Math.floor(Math.random() * inspirationalPrompts.length)];
    onSearch(randomPrompt);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-900 text-white p-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
          TaskWizer Browser
        </h1>
        <p className="text-zinc-400 mb-8 max-w-md">A new way to explore the web.</p>
        
        <form onSubmit={handleSearchSubmit} className="w-full max-w-xl mx-auto mb-6">
            <input
                type="text"
                name="search"
                placeholder="Search with Google..."
                className="w-full px-5 py-3 bg-zinc-800 border border-zinc-700 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
        </form>
        
        <button
          onClick={handleInspireMe}
          className="group inline-flex items-center gap-2 px-6 py-2 bg-zinc-800/50 border border-zinc-700 rounded-full text-zinc-300 hover:text-white hover:border-indigo-500 transition-all duration-200"
        >
          {ICONS.SPARKLES}
          <span>Inspire Me</span>
        </button>
      </div>
    </div>
  );
};