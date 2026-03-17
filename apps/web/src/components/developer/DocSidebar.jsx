
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, Code2, Terminal, Zap, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DocSidebar() {
  const location = useLocation();

  const navGroups = [
    {
      title: 'Portal',
      items: [
        { name: 'Developer Dashboard', path: '/developers/dashboard', icon: LayoutDashboard },
        { name: 'Back to Platform', path: '/dashboard', icon: ArrowLeft },
      ]
    },
    {
      title: 'Documentation',
      items: [
        { name: 'Getting Started', path: '/developers/docs/getting-started', icon: Book },
        { name: 'SDK Reference', path: '/developers/docs/sdk', icon: Code2 },
        { name: 'API Reference', path: '/developers/docs/api', icon: Terminal },
        { name: 'Code Examples', path: '/developers/docs/examples', icon: Zap },
      ]
    }
  ];

  return (
    <aside className="w-[var(--doc-sidebar-width)] shrink-0 border-r border-border/50 bg-muted/10 hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-bold tracking-tight text-foreground mb-6">Developer Hub</h2>
        
        <nav className="space-y-8">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                          isActive 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
