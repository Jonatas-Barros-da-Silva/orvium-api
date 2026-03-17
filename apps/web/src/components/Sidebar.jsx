
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { LayoutDashboard, Building2, MapPin, Users, Activity, DollarSign, TrendingUp, Calculator, CreditCard, Wallet, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminMainItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/organizations', icon: Building2, label: 'Organizações' },
  { to: '/units', icon: MapPin, label: 'Unidades' },
  { to: '/professionals', icon: Users, label: 'Profissionais' },
  { to: '/procedures', icon: Activity, label: 'Procedimentos' },
];

const adminFinanceItems = [
  { to: '/balances', icon: DollarSign, label: 'Saldos Profissionais' },
  { to: '/payouts', icon: CreditCard, label: 'Pagamentos' },
  { to: '/financial-events', icon: DollarSign, label: 'Eventos Financeiros' },
  { to: '/repasses', icon: TrendingUp, label: 'Cálculos de Repasse' },
  { to: '/repasse-rules', icon: Calculator, label: 'Regras de Repasse' },
];

const professionalItems = [
  { to: '/professional/dashboard', icon: LayoutDashboard, label: 'Meu Painel' },
  { to: '/professional/transactions', icon: History, label: 'Histórico Financeiro' },
  { to: '/professional/payout-request', icon: DollarSign, label: 'Solicitar Saque' },
  { to: '/professional/wallet-summary', icon: Wallet, label: 'Minha Carteira' },
];

const Sidebar = () => {
  const { isProfessional } = useAuth();

  const renderNavItems = (items) => {
    return items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          cn(
            "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-[500] transition-all duration-200 group",
            isActive 
              ? "bg-primary text-white shadow-md" 
              : "text-slate-300 hover:bg-slate-800 hover:text-white"
          )
        }
      >
        <div className="flex items-center gap-3">
          <item.icon className={cn("w-5 h-5", "opacity-80 group-hover:opacity-100")} />
          {item.label}
        </div>
      </NavLink>
    ));
  };

  return (
    <aside className="w-64 bg-[hsl(var(--sidebar-bg))] border-r border-slate-800 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-6 flex flex-col shadow-inner">
      <nav className="flex-1 px-4 space-y-8">
        
        {isProfessional ? (
          <div className="space-y-2">
            <p className="px-3 text-xs font-[600] text-slate-400 uppercase tracking-wider mb-2">
              Portal do Profissional
            </p>
            {renderNavItems(professionalItems)}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="px-3 text-xs font-[600] text-slate-400 uppercase tracking-wider mb-2">
                Gestão Principal
              </p>
              {renderNavItems(adminMainItems)}
            </div>

            <div className="space-y-2">
              <p className="px-3 text-xs font-[600] text-slate-400 uppercase tracking-wider mb-2">
                Financeiro & Repasses
              </p>
              {renderNavItems(adminFinanceItems)}
            </div>
          </>
        )}

      </nav>
    </aside>
  );
};

export default Sidebar;
