import React, { useState, useEffect, useRef } from 'react';
import { ICONS, NEW_TAB_URL } from '../constants';
import { HamburgerMenu } from './HamburgerMenu';
import type { Tab } from '../types';

interface AddressBarProps {
  activeTab: Tab | undefined;
  isBookmarked: boolean;
  onNavigate: (url: string, options?: { newTab?: boolean }) => void;
  onSearch: (query: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onToggleBookmark: () => void;
  onToggleVerticalTabs: () => void;
}

// Placeholder messages for typewriter animation
const PLACEHOLDER_MESSAGES = [
  "Ask me anything...",
  "What would you like to know?",
  "Let's have a conversation...",
  "I'm here to help...",
  "What's on your mind?",
  "Start chatting with AI...",
  "How can I assist you today?",
  "Curious about something?",
  "Need help with anything?",
  "Let's explore ideas together..."
];

export const AddressBar: React.FC<AddressBarProps> = ({
  activeTab, isBookmarked, onNavigate, onSearch, onBack, onForward, onReload, onToggleBookmark, onToggleVerticalTabs
}) => {
  const [inputValue, setInputValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<{
    messageIndex: number;
    charIndex: number;
    isTyping: boolean;
    isPaused: boolean;
    timeoutId: NodeJS.Timeout | null;
  }>({
    messageIndex: 0,
    charIndex: 0,
    isTyping: true,
    isPaused: false,
    timeoutId: null
  });

  useEffect(() => {
    // This effect syncs the input value when navigating via back/forward or switching tabs.
    // CRITICAL: It MUST NOT run when the user is actively typing in the input,
    // otherwise it will overwrite their input and break navigation.
    if (activeTab && document.activeElement !== inputRef.current) {
      const displayUrl = activeTab.url.startsWith('gemini://search')
        ? new URL(activeTab.url).searchParams.get('q') || ''
        : activeTab.url;

      setInputValue(displayUrl);
    }
  }, [activeTab]);

  // Typewriter animation effect
  useEffect(() => {
    // Don't run animation if input is focused or has value
    if (isInputFocused || inputValue) {
      return;
    }

    const animate = () => {
      const state = animationRef.current;
      const currentMessage = PLACEHOLDER_MESSAGES[state.messageIndex];

      // Clear any existing timeout
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }

      if (state.isPaused) {
        // Pause phase - wait before erasing
        state.timeoutId = setTimeout(() => {
          state.isPaused = false;
          state.isTyping = false;
          animate();
        }, 2500); // 2.5 second pause
      } else if (state.isTyping) {
        // Typing phase
        if (state.charIndex < currentMessage.length) {
          setPlaceholder(currentMessage.substring(0, state.charIndex + 1));
          state.charIndex++;
          // Variable typing speed (50-100ms)
          const delay = 50 + Math.random() * 50;
          state.timeoutId = setTimeout(animate, delay);
        } else {
          // Finished typing, enter pause phase
          state.isPaused = true;
          animate();
        }
      } else {
        // Erasing phase
        if (state.charIndex > 0) {
          state.charIndex--;
          setPlaceholder(currentMessage.substring(0, state.charIndex));
          // Faster erasing (30-50ms)
          const delay = 30 + Math.random() * 20;
          state.timeoutId = setTimeout(animate, delay);
        } else {
          // Finished erasing, move to next message
          state.messageIndex = (state.messageIndex + 1) % PLACEHOLDER_MESSAGES.length;
          state.isTyping = true;
          state.timeoutId = setTimeout(animate, 500); // Brief pause before next message
        }
      }
    };

    // Start animation
    animate();

    // Cleanup on unmount or when dependencies change
    return () => {
      if (animationRef.current.timeoutId) {
        clearTimeout(animationRef.current.timeoutId);
      }
    };
  }, [isInputFocused, inputValue]);
  
  const handleDragStart = (e: React.DragEvent) => {
      if (!activeTab || activeTab.url.startsWith('about:')) return;
      e.dataTransfer.setData("text/uri-list", activeTab.url);
      e.dataTransfer.setData("text/plain", activeTab.url);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || (activeTab && trimmedInput === activeTab.url)) return;

    const isUrl = trimmedInput.includes('.') || trimmedInput.startsWith('localhost') || trimmedInput.startsWith('http');
    if (isUrl) {
      const properUrl = trimmedInput.startsWith('http') ? trimmedInput : `https://${trimmedInput}`;
      onNavigate(properUrl);
    } else {
      // Use Gemini AI search for non-URL queries
      onSearch(trimmedInput);
    }
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        // Handle special Enter key combinations for quick navigation
        const trimmedInput = inputValue.trim();
        if (!trimmedInput) return;

        // ALT+Enter: Open in new tab (doesn't modify the URL)
        if (e.altKey) {
            e.preventDefault();
            const isUrl = trimmedInput.includes('.') || trimmedInput.startsWith('localhost') || trimmedInput.startsWith('http');
            if (isUrl) {
                const properUrl = trimmedInput.startsWith('http') ? trimmedInput : `https://${trimmedInput}`;
                onNavigate(properUrl, { newTab: true });
            } else {
                // For search queries, we can't open in new tab directly from here
                // Just perform regular search
                onSearch(trimmedInput);
            }
            inputRef.current?.blur();
            return;
        }

        // CTRL+SHIFT+Enter: Add www. and .net
        if (e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            const url = `https://www.${trimmedInput}.net`;
            setInputValue(url);
            onNavigate(url);
            inputRef.current?.blur();
            return;
        }

        // CTRL+Enter: Add www. and .com
        if (e.ctrlKey) {
            e.preventDefault();
            const url = `https://www.${trimmedInput}.com`;
            setInputValue(url);
            onNavigate(url);
            inputRef.current?.blur();
            return;
        }

        // SHIFT+Enter: Add www. and .org
        if (e.shiftKey) {
            e.preventDefault();
            const url = `https://www.${trimmedInput}.org`;
            setInputValue(url);
            onNavigate(url);
            inputRef.current?.blur();
            return;
        }

        // Regular Enter: Form submission is handled by onSubmit
        return;
    }
  }

  const handleHomeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Middle-click (button 1) opens home in new tab
    if (e.button === 1) {
      e.preventDefault();
      onNavigate(NEW_TAB_URL, { newTab: true });
    }
    // Left-click (button 0) is handled by onClick
  };

  const canGoBack = activeTab ? activeTab.historyIndex > 0 : false;
  const canGoForward = activeTab ? activeTab.historyIndex < activeTab.history.length - 1 : false;
  const isInternalPage = activeTab?.url.startsWith('about:') ?? true;


  return (
    <>
      <style>{`
        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.3), 0 0 20px rgba(99, 102, 241, 0.2), 0 0 30px rgba(99, 102, 241, 0.1);
          }
          50% {
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.5), 0 0 30px rgba(99, 102, 241, 0.3), 0 0 45px rgba(99, 102, 241, 0.2);
          }
        }

        @keyframes glow-pulse-focus {
          0%, 100% {
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.5), 0 0 30px rgba(99, 102, 241, 0.3), 0 0 45px rgba(99, 102, 241, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.7), 0 0 40px rgba(99, 102, 241, 0.4), 0 0 60px rgba(99, 102, 241, 0.3);
          }
        }

        .address-bar-input {
          animation: glow-pulse 3s ease-in-out infinite;
          will-change: box-shadow;
        }

        .address-bar-input:focus {
          animation: glow-pulse-focus 2s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-center bg-zinc-800 h-12 px-2 gap-1 border-b border-zinc-700/50 flex-shrink-0">
        <button onClick={onBack} disabled={!canGoBack} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:hover:bg-transparent transition-colors">{ICONS.CHEVRON_LEFT}</button>
        <button onClick={onForward} disabled={!canGoForward} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:hover:bg-transparent transition-colors">{ICONS.CHEVRON_RIGHT}</button>
        <button onClick={onReload} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">{ICONS.RELOAD}</button>
        <button
          onClick={() => onNavigate(NEW_TAB_URL)}
          onMouseDown={handleHomeClick}
          className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          {ICONS.HOME}
        </button>
        <button onClick={onToggleVerticalTabs} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">{ICONS.VERTICAL_TABS}</button>

        <div className="flex-grow flex items-center relative h-full py-1.5">
          <div
              className={`absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 ${isInternalPage ? 'cursor-default' : 'cursor-grab'}`}
              draggable={!isInternalPage}
              onDragStart={handleDragStart}
          >
              {activeTab?.isSecure ? ICONS.LOCK : ICONS.INFO}
          </div>
          <form onSubmit={handleSubmit} className="w-full h-full">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                setIsInputFocused(true);
                e.target.select();
              }}
              onBlur={() => setIsInputFocused(false)}
              className="address-bar-input w-full h-full bg-zinc-900 rounded-full text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-9 pr-4"
              placeholder={placeholder || "Search Google or enter an address"}
            />
          </form>
        </div>

        <button onClick={onToggleBookmark} disabled={isInternalPage} className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:text-zinc-600 disabled:hover:bg-transparent">
          {isBookmarked ? ICONS.BOOKMARK_FILLED : ICONS.BOOKMARK}
        </button>
        <HamburgerMenu onNavigate={onNavigate} />
      </div>
    </>
  );
};