
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Filter, Building2, Calendar, User, Activity } from 'lucide-react';

const ReportingFilters = ({ filters, setFilters }) => {
  const [organizations, setOrganizations] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [procedures, setProcedures] = useState([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [orgs, profs, procs] = await Promise.all([
          pb.collection('organizations').getFullList({ $autoCancel: false }),
          pb.collection('professionals').getFullList({ $autoCancel: false }),
          pb.collection('procedures').getFullList({ $autoCancel: false })
        ]);
        
        setOrganizations(orgs);
        setProfessionals(profs);
        setProcedures(procs);

        // Set default organization if none selected
        if (!filters.organizationId && orgs.length > 0) {
          setFilters(prev => ({ ...prev, organizationId: orgs[0].organization_id }));
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [key]: value }
    }));
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
        <Filter className="w-4 h-4" />
        <h3>Filtros Globais</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Organization */}
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3"/> Organização *</Label>
          <select 
            className="flex h-9 w-full rounded-md border border-input bg-slate-50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filters.organizationId}
            onChange={(e) => handleFilterChange('organizationId', e.target.value)}
          >
            <option value="" disabled>Selecione...</option>
            {organizations.map(org => (
              <option key={org.id} value={org.organization_id}>{org.organization_name}</option>
            ))}
          </select>
        </div>

        {/* Date Start */}
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> Data Inicial</Label>
          <Input 
            type="date" 
            className="h-9 bg-slate-50 text-sm"
            value={filters.dateRange.start}
            onChange={(e) => handleDateChange('start', e.target.value)}
          />
        </div>

        {/* Date End */}
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> Data Final</Label>
          <Input 
            type="date" 
            className="h-9 bg-slate-50 text-sm"
            value={filters.dateRange.end}
            onChange={(e) => handleDateChange('end', e.target.value)}
          />
        </div>

        {/* Professional */}
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3"/> Profissional</Label>
          <select 
            className="flex h-9 w-full rounded-md border border-input bg-slate-50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filters.professionalId}
            onChange={(e) => handleFilterChange('professionalId', e.target.value)}
          >
            <option value="">Todos os Profissionais</option>
            {professionals
              .filter(p => !filters.organizationId || p.organization_id === filters.organizationId)
              .map(prof => (
              <option key={prof.id} value={prof.professional_id}>{prof.professional_name}</option>
            ))}
          </select>
        </div>

        {/* Procedure */}
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 flex items-center gap-1"><Activity className="w-3 h-3"/> Procedimento</Label>
          <select 
            className="flex h-9 w-full rounded-md border border-input bg-slate-50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filters.procedureId}
            onChange={(e) => handleFilterChange('procedureId', e.target.value)}
          >
            <option value="">Todos os Procedimentos</option>
            {procedures
              .filter(p => !filters.organizationId || p.organization_id === filters.organizationId)
              .map(proc => (
              <option key={proc.id} value={proc.procedure_id}>{proc.procedure_name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReportingFilters;
