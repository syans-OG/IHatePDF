import React from 'react';
import {
  FileText,
  FileType2,
  Image,
  FileImage,
  Merge,
  Split,
  Presentation,
  Tv2,
  Minimize2,
  Bomb,
  ArrowRight,
} from 'lucide-react';
import type { ToolDef } from '../data/tools';

interface ToolCardProps {
  tool: ToolDef;
  onSelect: (id: string) => void;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  FileType2,
  Image,
  FileImage,
  Merge,
  Split,
  Presentation,
  Tv2,
  Minimize2,
  Bomb,
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect, className = '' }) => {
  const IconComponent = ICON_MAP[tool.iconName] || FileText;
  const isTroll = tool.category === 'troll';

  return (
    <div
      onClick={() => onSelect(tool.id)}
      className={`group relative cursor-pointer p-6 bento-item ${
        isTroll ? 'troll-accent' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-8">
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-xl border ${
            isTroll
              ? 'border-accent-troll/20 bg-accent-troll/10 text-accent-troll'
              : 'border-border-hover bg-bg-surface text-text-bright'
          }`}
        >
          <IconComponent className="w-5 h-5" strokeWidth={1.5} />
        </div>

        {tool.badge && (
          <span
            className={`px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-md border ${
              tool.badgeType === 'troll'
                ? 'bg-accent-troll/10 text-accent-troll border-accent-troll/20'
                : 'bg-accent-red/10 text-accent-red border-accent-red/20'
            }`}
          >
            {tool.badge}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <h3 className={`text-lg font-semibold tracking-tight ${isTroll ? 'text-accent-troll' : 'text-text-primary'}`}>
          {tool.name}
        </h3>
        <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
          {tool.nameIndo}
        </p>
      </div>

      <p className="text-[13px] text-text-muted mt-4 line-clamp-2 leading-relaxed font-normal">
        {tool.description}
      </p>

      <div className="mt-8 flex items-center justify-between text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
        <span>{isTroll ? 'Maximize Filesize' : 'Open Tool'}</span>
        <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
      </div>
    </div>
  );
};

