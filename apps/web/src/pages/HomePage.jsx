
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Activity, Shield, Zap } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border/40 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">O</span>
          </div>
          <span className="font-bold text-xl tracking-tight">ORVIUM</span>
        </div>
        <Link to="/login">
          <Button variant="outline">Acessar Dashboard</Button>
        </Link>
      </header>

      <main className="flex-1">
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10"></div>
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Apresentando Wave 1
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground text-balance">
              Gestão Inteligente para <br className="hidden md:block" />
              <span className="text-primary">Saúde e Finanças</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Plataforma integrada para controle de organizações, unidades, profissionais e repasses financeiros com precisão e segurança.
            </p>
            <div className="pt-4">
              <Link to="/login">
                <Button size="lg" className="h-12 px-8 text-base rounded-full shadow-lg shadow-primary/20 transition-all hover:-translate-y-1">
                  Acessar Plataforma <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Controle Operacional</h3>
                <p className="text-muted-foreground leading-relaxed">Gestão centralizada de unidades e procedimentos com regras de repasse customizáveis.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Segurança Financeira</h3>
                <p className="text-muted-foreground leading-relaxed">Acompanhamento em tempo real de saldos e extratos de profissionais com total transparência.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Alta Performance</h3>
                <p className="text-muted-foreground leading-relaxed">Arquitetura moderna projetada para escalar junto com o crescimento da sua organização.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
