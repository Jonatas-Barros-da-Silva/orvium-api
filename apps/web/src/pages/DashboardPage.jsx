
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';
import ReportingFilters from '@/components/ReportingFilters.jsx';
import FinancialMetricsCards from '@/components/FinancialMetricsCards.jsx';
import FinancialFlowVisualization from '@/components/FinancialFlowVisualization.jsx';
import ProfessionalPerformanceReport from '@/components/ProfessionalPerformanceReport.jsx';
import ProcedureFinancialAnalysis from '@/components/ProcedureFinancialAnalysis.jsx';
import FinancialActivityReport from '@/components/FinancialActivityReport.jsx';
import { useFinancialMetrics } from '@/hooks/useFinancialMetrics.js';

const DashboardPage = () => {
  // Global Filters State
  const [filters, setFilters] = useState({
    organizationId: '',
    dateRange: {
      start: '',
      end: ''
    },
    professionalId: '',
    procedureId: ''
  });

  // Fetch aggregated data based on filters
  const { metrics, professionalStats, procedureStats, recentEvents, loading, error } = useFinancialMetrics(filters);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-[800] tracking-tight text-slate-900 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          Dashboard Financeiro
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">Visão consolidada de receitas, repasses e pagamentos.</p>
      </div>

      <ReportingFilters filters={filters} setFilters={setFilters} />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6">
          Erro ao carregar dados: {error}
        </div>
      )}

      {!filters.organizationId ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
          Selecione uma organização nos filtros acima para visualizar os dados.
        </div>
      ) : (
        <>
          <FinancialMetricsCards metrics={metrics} loading={loading} />
          
          <FinancialFlowVisualization metrics={metrics} loading={loading} />

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <Tabs defaultValue="professionals" className="w-full">
              <TabsList className="mb-6 bg-slate-100/50 p-1">
                <TabsTrigger value="professionals" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Desempenho de Profissionais
                </TabsTrigger>
                <TabsTrigger value="procedures" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Análise de Procedimentos
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Atividade Recente
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="professionals" className="mt-0 outline-none">
                {loading ? <div className="py-12 text-center text-slate-500">Carregando relatório...</div> : <ProfessionalPerformanceReport data={professionalStats} />}
              </TabsContent>
              
              <TabsContent value="procedures" className="mt-0 outline-none">
                {loading ? <div className="py-12 text-center text-slate-500">Carregando relatório...</div> : <ProcedureFinancialAnalysis data={procedureStats} />}
              </TabsContent>
              
              <TabsContent value="activity" className="mt-0 outline-none">
                {loading ? <div className="py-12 text-center text-slate-500">Carregando relatório...</div> : <FinancialActivityReport data={recentEvents} />}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
