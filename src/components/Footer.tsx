import React from 'react';
import { Shield, Zap, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-24 border-t border-border-main bg-transparent text-text-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 font-bold text-text-primary text-lg tracking-tighter">
            <span>iHate<span className="text-accent-red">PDF</span></span>
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-bg-surface text-text-secondary border border-border-strong font-medium tracking-wide uppercase">
              Client-Side
            </span>
          </div>
          <p className="text-[13px] text-text-muted mt-2 max-w-md">
            All files stay strictly inside your browser. No files are uploaded to any server. Completely free & private.
          </p>
        </div>

        <div className="flex items-center gap-6 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
          <div className="flex items-center gap-1.5 hover:text-text-primary transition-colors cursor-default">
            <Shield className="w-3.5 h-3.5" />
            <span>Zero Server</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-text-primary transition-colors cursor-default">
            <Zap className="w-3.5 h-3.5" />
            <span>Instant</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-accent-troll transition-colors cursor-default">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Size Maximizer</span>
          </div>
        </div>

        <div className="text-[11px] text-text-muted font-medium">
          <p>Made By Syans.</p>
        </div>
      </div>
    </footer>
  );
};

