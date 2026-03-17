
import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useFinancialMetrics = (filters) => {
  const [data, setData] = useState({
    metrics: {
      totalProcedures: 0,
      totalRevenue: 0,
      totalRepasse: 0,
      totalPaid: 0,
      outstandingBalance: 0,
    },
    professionalStats: [],
    procedureStats: [],
    recentEvents: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!filters.organizationId) return;

      setData(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Build base filters
        let baseFilter = `organization_id = "${filters.organizationId}"`;
        
        if (filters.dateRange?.start && filters.dateRange?.end) {
          // Add 1 day to end date to include the full day
          const endDate = new Date(filters.dateRange.end);
          endDate.setDate(endDate.getDate() + 1);
          const endStr = endDate.toISOString().split('T')[0];
          
          baseFilter += ` && created >= "${filters.dateRange.start}" && created < "${endStr}"`;
        }

        if (filters.professionalId) {
          baseFilter += ` && professional_id = "${filters.professionalId}"`;
        }

        // 1. Fetch Financial Events (Revenue & Procedures)
        let eventsFilter = baseFilter;
        if (filters.procedureId) {
          eventsFilter += ` && procedure_id = "${filters.procedureId}"`;
        }
        
        const events = await pb.collection('financial_events').getFullList({
          filter: eventsFilter,
          $autoCancel: false
        });

        // 2. Fetch Repasse Calculations
        const repasses = await pb.collection('repasse_calculations').getFullList({
          filter: baseFilter + ` && calculation_status = "completed"`,
          $autoCancel: false
        });

        // 3. Fetch Payouts
        const payouts = await pb.collection('payouts').getFullList({
          filter: baseFilter + ` && payout_status = "paid"`,
          $autoCancel: false
        });

        // 4. Fetch Balances (Current snapshot, not strictly date filtered for 'current' balance)
        let balanceFilter = `organization_id = "${filters.organizationId}"`;
        if (filters.professionalId) balanceFilter += ` && professional_id = "${filters.professionalId}"`;
        
        const balances = await pb.collection('professional_balances').getFullList({
          filter: balanceFilter,
          $autoCancel: false
        });

        // 5. Fetch Professionals and Procedures for mapping names
        const [profs, procs] = await Promise.all([
          pb.collection('professionals').getFullList({ filter: `organization_id = "${filters.organizationId}"`, $autoCancel: false }),
          pb.collection('procedures').getFullList({ filter: `organization_id = "${filters.organizationId}"`, $autoCancel: false })
        ]);

        const profMap = {};
        profs.forEach(p => profMap[p.professional_id] = p.professional_name);
        
        const procMap = {};
        procs.forEach(p => procMap[p.procedure_id] = p.procedure_name);

        // --- Aggregations ---
        
        let totalProcedures = 0;
        let totalRevenue = 0;
        let totalRepasse = 0;
        let totalPaid = 0;
        let outstandingBalance = 0;

        const profStatsMap = {};
        const procStatsMap = {};

        // Process Events
        events.forEach(e => {
          if (e.event_type === 'PROCEDURE_EXECUTED') {
            totalProcedures++;
            totalRevenue += e.gross_amount;

            // Prof Stats
            if (!profStatsMap[e.professional_id]) {
              profStatsMap[e.professional_id] = { id: e.professional_id, name: profMap[e.professional_id] || e.professional_id, procedures: 0, revenue: 0, repasse: 0, paid: 0, balance: 0 };
            }
            profStatsMap[e.professional_id].procedures++;
            profStatsMap[e.professional_id].revenue += e.gross_amount;

            // Proc Stats
            if (!procStatsMap[e.procedure_id]) {
              procStatsMap[e.procedure_id] = { id: e.procedure_id, name: procMap[e.procedure_id] || e.procedure_id, executions: 0, revenue: 0, repasse: 0 };
            }
            procStatsMap[e.procedure_id].executions++;
            procStatsMap[e.procedure_id].revenue += e.gross_amount;
          }
        });

        // Process Repasses
        repasses.forEach(r => {
          totalRepasse += r.calculated_repasse_amount;
          if (profStatsMap[r.professional_id]) {
            profStatsMap[r.professional_id].repasse += r.calculated_repasse_amount;
          }
          
          // Try to map repasse back to procedure via event
          const relatedEvent = events.find(e => e.event_id === r.event_id);
          if (relatedEvent && procStatsMap[relatedEvent.procedure_id]) {
            procStatsMap[relatedEvent.procedure_id].repasse += r.calculated_repasse_amount;
          }
        });

        // Process Payouts
        payouts.forEach(p => {
          totalPaid += p.payout_amount;
          if (profStatsMap[p.professional_id]) {
            profStatsMap[p.professional_id].paid += p.payout_amount;
          }
        });

        // Process Balances
        balances.forEach(b => {
          outstandingBalance += b.current_balance;
          if (profStatsMap[b.professional_id]) {
            profStatsMap[b.professional_id].balance = b.current_balance;
          } else {
            profStatsMap[b.professional_id] = { 
              id: b.professional_id, 
              name: profMap[b.professional_id] || b.professional_id, 
              procedures: 0, revenue: 0, repasse: 0, paid: 0, 
              balance: b.current_balance 
            };
          }
        });

        // Format arrays
        const professionalStats = Object.values(profStatsMap).sort((a, b) => b.revenue - a.revenue);
        const procedureStats = Object.values(procStatsMap).map(p => ({
          ...p,
          avgRepasse: p.executions > 0 ? p.repasse / p.executions : 0
        })).sort((a, b) => b.revenue - a.revenue);

        // Recent Events (last 50)
        const recentEvents = events
          .sort((a, b) => new Date(b.created) - new Date(a.created))
          .slice(0, 50)
          .map(e => ({
            ...e,
            professional_name: profMap[e.professional_id] || e.professional_id,
            procedure_name: procMap[e.procedure_id] || e.procedure_id
          }));

        setData({
          metrics: {
            totalProcedures,
            totalRevenue,
            totalRepasse,
            totalPaid,
            outstandingBalance
          },
          professionalStats,
          procedureStats,
          recentEvents,
          loading: false,
          error: null
        });

      } catch (err) {
        console.error("Error fetching financial metrics:", err);
        setData(prev => ({ ...prev, loading: false, error: err.message }));
      }
    };

    fetchMetrics();
  }, [filters]);

  return data;
};
