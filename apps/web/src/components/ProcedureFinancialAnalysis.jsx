
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, ArrowUpDown } from 'lucide-react';

const ProcedureFinancialAnalysis = ({ data }) => {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'revenue', direction: 'desc' });

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = data.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const sortedData = [...filteredData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Análise por Procedimento</h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar procedimento..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-white"
          />
        </div>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-600 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Procedimento <ArrowUpDown className="w-3 h-3" /></div>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('executions')}>
                <div className="flex items-center justify-end gap-1">Execuções <ArrowUpDown className="w-3 h-3" /></div>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('revenue')}>
                <div className="flex items-center justify-end gap-1">Receita Total <ArrowUpDown className="w-3 h-3" /></div>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('repasse')}>
                <div className="flex items-center justify-end gap-1">Repasse Gerado <ArrowUpDown className="w-3 h-3" /></div>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-600 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('avgRepasse')}>
                <div className="flex items-center justify-end gap-1">Repasse Médio/Exec <ArrowUpDown className="w-3 h-3" /></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Nenhum dado encontrado.</TableCell></TableRow>
            ) : (
              sortedData.map((proc) => (
                <TableRow key={proc.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-medium text-slate-700 py-3">{proc.name}</TableCell>
                  <TableCell className="text-right py-3 font-mono-num">{proc.executions}</TableCell>
                  <TableCell className="text-right py-3 font-mono-num text-blue-600 font-medium">{formatCurrency(proc.revenue)}</TableCell>
                  <TableCell className="text-right py-3 font-mono-num text-orange-600 font-medium">{formatCurrency(proc.repasse)}</TableCell>
                  <TableCell className="text-right py-3 font-mono-num text-slate-600">{formatCurrency(proc.avgRepasse)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProcedureFinancialAnalysis;
