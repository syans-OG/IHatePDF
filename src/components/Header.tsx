import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTool: string | null;
  onSelectTool: (toolId: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTool, onSelectTool }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check initial theme from document class
    if (document.documentElement.classList.contains('light')) {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.add('light');
      setTheme('light');
    } else {
      document.documentElement.classList.remove('light');
      setTheme('dark');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-main bg-bg-main/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <button
          type="button"
          onClick={() => onSelectTool(null)}
          className="flex items-center transition-all cursor-pointer"
        >
          <span className="text-xl font-bold tracking-tighter text-text-primary font-sans">
            iHate<span className="text-accent-red">PDF</span>
          </span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition-colors border border-border-hover bg-bg-surface text-text-secondary hover:text-text-primary hover:border-border-strong cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {activeTool !== null && (
            <button
              type="button"
              onClick={() => onSelectTool(null)}
              className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-transparent hover:bg-bg-surface rounded-md transition-colors border border-transparent hover:border-border-hover cursor-pointer"
            >
              All Tools
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
