
import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CodeExampleBlock({ code, language = 'javascript', title, className }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={cn("rounded-xl overflow-hidden border border-border/50 bg-[hsl(var(--code-bg))] my-6 shadow-sm", className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
          </div>
          {title && (
            <span className="text-xs font-medium text-slate-400 ml-2 font-mono">
              {title}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-[hsl(var(--code-foreground))] text-sm font-mono m-0">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
