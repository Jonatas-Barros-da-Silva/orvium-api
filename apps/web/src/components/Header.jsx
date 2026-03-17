
import React from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bell } from 'lucide-react';

const Header = () => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-white border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm shadow-primary/20">
          <span className="text-primary-foreground font-[800] text-xl">O</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-[700] text-xl tracking-tight text-foreground">ORVIUM</span>
          <span className="text-[10px] font-[600] bg-accent text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
            Wave 1
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="text-slate-400 hover:text-primary transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[hsl(var(--alert))] rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-6 w-px bg-border"></div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-[500] text-slate-600">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <span className="hidden md:inline-block">{currentUser?.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-slate-500 hover:text-destructive hover:bg-destructive/10 font-[500]">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
