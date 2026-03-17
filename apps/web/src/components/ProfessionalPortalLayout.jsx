
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Header from './Header.jsx';
import { cn } from '@/lib/utils';

const ProfessionalPortalLayout = () => {
  const tabs = [
    { name: 'Dashboard', path: '/professional/dashboard' },
    { name: 'Histórico de Transações', path: '/professional/transactions' },
    { name: 'Solicitar Saque', path: '/professional/payout-request' },
    { name: 'Resumo da Carteira', path: '/professional/wallet-summary' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      <Header />
      
      <div className="bg-white border-b border-border px-6 shadow-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto flex gap-8 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => cn(
                "py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
                isActive 
                  ? "border-primary text-primary" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
            >
              {tab.name}
            </NavLink>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ProfessionalPortalLayout;
