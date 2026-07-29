import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToolCard } from './components/ToolCard';
import { ToolWorkspace } from './components/ToolWorkspace';
import { TrollBloatWorkspace } from './components/TrollBloatWorkspace';
import { TOOLS } from './data/tools';
import { Flame, Sparkles, Bomb, Layers, ShieldCheck, Zap } from 'lucide-react';

export function App() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'convert' | 'edit' | 'troll'>('all');

  const selectedTool = TOOLS.find((t) => t.id === activeToolId) || null;

  const filteredTools = TOOLS.filter((tool) => {
    if (categoryFilter === 'all') return true;
    return tool.category === categoryFilter;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-text-bright selection:text-[#000]">
      {/* Navbar Header */}
      <Header
        activeTool={activeToolId}
        onSelectTool={(toolId) => {
          setActiveToolId(toolId);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        {activeToolId === null ? (
          <div className="space-y-16 animate-fade-in">
            {/* Hero Section (AIDA Structure) */}
            <div className="text-center space-y-6 pt-8 pb-4 max-w-3xl mx-auto">


              <h1 className="text-4xl sm:text-6xl font-semibold tracking-tighter text-text-primary leading-[1.1]">
                Master your PDFs.<br />
                <span className="text-text-secondary">Or make them ridiculously</span> <span className="text-accent-troll">huge.</span>
              </h1>

              <p className="text-text-muted text-base sm:text-lg max-w-lg mx-auto font-normal leading-relaxed">
                Convert, merge, split, compress, or use our signature <span className="text-text-primary font-medium">Bloater</span> to artificially inflate files up to 500 MB in seconds. Client-side processing guarantees your privacy.
              </p>

              {/* Quick Feature Badges */}
              <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-text-muted uppercase tracking-wide">
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Private</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Zero Upload</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <Bomb className="w-3.5 h-3.5 text-accent-troll" />
                  <span>Payload Injection</span>
                </div>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4">
              {[
                { id: 'all', label: 'All Tools (10)', icon: Layers },
                { id: 'convert', label: 'Conversion', icon: Sparkles },
                { id: 'edit', label: 'Edit & Merge', icon: Flame },
                { id: 'troll', label: 'Special Edition', icon: Bomb },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-xs sm:text-[13px] transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? tab.id === 'troll'
                          ? 'bg-accent-troll/10 text-accent-troll border border-accent-troll/20'
                          : 'bg-border-strong text-text-primary border border-border-hover'
                        : 'bg-transparent text-text-muted hover:text-text-primary border border-transparent'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.5} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tools Grid (Gapless Bento) */}
            <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-8">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  className={
                    filteredTools.length === 1 
                      ? 'col-span-full' 
                      : filteredTools.length === 10 && tool.id === 'inflate' 
                        ? 'lg:col-span-3' 
                        : ''
                  }
                  onSelect={(id) => {
                    setActiveToolId(id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        ) : activeToolId === 'inflate' ? (
          <TrollBloatWorkspace />
        ) : selectedTool ? (
          <ToolWorkspace
            tool={selectedTool}
            onBack={() => setActiveToolId(null)}
          />
        ) : null}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
