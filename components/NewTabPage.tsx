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
    <>
      <style>{`
        @keyframes search-glow-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.6);
          }
        }

        @keyframes search-glow-pulse-focus {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.8);
          }
        }

        .search-input-glow {
          animation: search-glow-pulse 3s ease-in-out infinite;
          will-change: box-shadow;
        }

        .search-input-glow:focus {
          animation: search-glow-pulse-focus 2s ease-in-out infinite;
        }
      `}</style>
      <div className="flex flex-col items-center justify-center h-full bg-browser-bg text-white p-4">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-browser-primary to-browser-accent">
            TaskWizer Chat
          </h1>
          <p className="text-browser-text-muted mb-8 max-w-md mx-auto">Your AI-powered conversation companion</p>

          <form onSubmit={handleSearchSubmit} className="w-full max-w-xl mx-auto mb-6">
              <input
                  type="text"
                  name="search"
                  placeholder="Search with Google..."
                  className="search-input-glow w-full px-5 py-3 bg-browser-surface border border-browser-border rounded-full text-white placeholder:text-browser-text-muted focus:outline-none focus:ring-2 focus:ring-browser-primary transition-all"
              />
          </form>

          <button
            onClick={handleInspireMe}
            className="group inline-flex items-center gap-2 px-6 py-2 bg-browser-surface/50 border border-browser-border rounded-full text-browser-text-muted hover:text-white hover:border-browser-primary transition-all duration-200"
          >
            {ICONS.SPARKLES}
            <span>Inspire Me</span>
          </button>
        </div>
      </div>
    </>
  );
};