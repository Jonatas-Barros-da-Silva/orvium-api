
import { useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';

export const useRepasseEngine = () => {
  const calculateRepasse = useCallback(async (event) => {
    try {
      if (event.event_type !== 'PROCEDURE_EXECUTED') return;

      // Fetch professional
      const profs = await pb.collection('professionals').getFullList({ 
        filter: `professional_id="${event.professional_id}"`, 
        $autoCancel: false 
      });
      const prof = profs[0];
      
      if (!prof || !prof.repasse_rule_id) {
        throw new Error('No professional found or no repasse rule assigned');
      }

      // Fetch rule
      const rules = await pb.collection('repasse_rules').getFullList({ 
        filter: `repasse_rule_id="${prof.repasse_rule_id}"`, 
        $autoCancel: false 
      });
      const rule = rules[0];
      
      if (!rule || !rule.active_status) {
        throw new Error('Repasse rule not found or inactive');
      }

      let amount = 0;
      const gross = event.gross_amount || 0;
      
      if (rule.repasse_model === 'percentage') {
        amount = gross * ((rule.percentage_value || 0) / 100);
      } else if (rule.repasse_model === 'fixed') {
        amount = rule.fixed_amount || 0;
      } else if (rule.repasse_model === 'hybrid') {
        amount = (gross * ((rule.percentage_value || 0) / 100)) + (rule.fixed_amount || 0);
      }

      // Create calculation record
      await pb.collection('repasse_calculations').create({
        repasse_calculation_id: crypto.randomUUID(),
        organization_id: event.organization_id,
        event_id: event.event_id,
        professional_id: event.professional_id,
        repasse_rule_id: rule.repasse_rule_id,
        gross_amount: gross,
        calculated_repasse_amount: amount,
        calculation_status: 'completed'
      }, { $autoCancel: false });

      console.log(`Repasse calculated successfully for event ${event.event_id}`);
      return true;

    } catch (error) {
      console.error('Repasse calculation failed:', error);
      
      // Create failed record
      try {
        await pb.collection('repasse_calculations').create({
          repasse_calculation_id: crypto.randomUUID(),
          organization_id: event.organization_id || 'unknown',
          event_id: event.event_id || 'unknown',
          professional_id: event.professional_id || 'unknown',
          repasse_rule_id: 'unknown',
          gross_amount: event.gross_amount || 0,
          calculated_repasse_amount: 0,
          calculation_status: 'failed'
        }, { $autoCancel: false });
      } catch (e) {
        console.error('Failed to create error record:', e);
      }
      return false;
    }
  }, []);

  useEffect(() => {
    // Listen for new financial events
    pb.collection('financial_events').subscribe('*', function (e) {
      if (e.action === 'create' && e.record.event_type === 'PROCEDURE_EXECUTED') {
        calculateRepasse(e.record);
      }
    });

    return () => {
      pb.collection('financial_events').unsubscribe('*');
    };
  }, [calculateRepasse]);

  return { calculateRepasse };
};
