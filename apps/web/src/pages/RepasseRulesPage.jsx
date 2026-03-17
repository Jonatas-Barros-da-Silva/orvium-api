
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Calculator, Search } from 'lucide-react';

const RepasseRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModel, setFilterModel] = useState('');

  const [formData, setFormData] = useState({
    rule_name: '',
    repasse_model: 'percentage',
    percentage_value: 0,
    fixed_amount: 0,
    active_status: true,
    organization_id: 'ORG-DEFAULT' // Defaulting for now
  });

  const fetchRules = async () => {
    try {
      const records = await pb.collection('repasse_rules').getFullList({ 
        sort: '-created',
        $autoCancel: false 
      });
      setRules(records);
    } catch (error) {
      console.error("Error fetching repasse rules:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenDialog = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        rule_name: rule.rule_name,
        repasse_model: rule.repasse_model,
        percentage_value: rule.percentage_value || 0,
        fixed_amount: rule.fixed_amount || 0,
        active_status: rule.active_status,
        organization_id: rule.organization_id
      });
    } else {
      setEditingRule(null);
      setFormData({
        rule_name: '',
        repasse_model: 'percentage',
        percentage_value: 0,
        fixed_amount: 0,
        active_status: true,
        organization_id: 'ORG-DEFAULT'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        percentage_value: Number(formData.percentage_value),
        fixed_amount: Number(formData.fixed_amount)
      };

      if (editingRule) {
        await pb.collection('repasse_rules').update(editingRule.id, payload, { $autoCancel: false });
      } else {
        payload.repasse_rule_id = `RULE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await pb.collection('repasse_rules').create(payload, { $autoCancel: false });
      }
      
      setIsDialogOpen(false);
      fetchRules();
    } catch (error) {
      console.error("Error saving rule:", error);
      alert("Erro ao salvar regra de repasse.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta regra?')) {
      try {
        await pb.collection('repasse_rules').delete(id, { $autoCancel: false });
        fetchRules();
      } catch (error) {
        console.error("Error deleting rule:", error);
        alert("Erro ao excluir regra. Pode estar em uso.");
      }
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.rule_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModel = filterModel ? rule.repasse_model === filterModel : true;
    return matchesSearch && matchesModel;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-[700] tracking-tight flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Regras de Repasse
          </h1>
          <p className="text-muted-foreground mt-1 font-[400]">Configure os modelos de comissionamento dos profissionais.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="orvium-btn-primary font-[600]">
          <Plus className="w-4 h-4 mr-2" /> Nova Regra
        </Button>
      </div>

      <div className="orvium-card p-4 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome da regra..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 h-11"
            />
          </div>
          <select 
            className="flex h-11 w-full md:w-48 rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
          >
            <option value="">Todos os Modelos</option>
            <option value="percentage">Percentual</option>
            <option value="fixed">Fixo</option>
            <option value="hybrid">Híbrido</option>
          </select>
        </div>
      </div>

      <div className="orvium-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-[600] text-slate-600 py-4">Nome da Regra</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Modelo</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Percentual</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Valor Fixo</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Status</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Carregando regras...</TableCell></TableRow>
            ) : filteredRules.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">Nenhuma regra encontrada.</TableCell></TableRow>
            ) : (
              filteredRules.map((rule) => (
                <TableRow key={rule.id} className="orvium-table-row">
                  <TableCell className="font-[600] text-slate-700 py-4">{rule.rule_name}</TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="capitalize bg-slate-50">
                      {rule.repasse_model === 'percentage' ? 'Percentual' : rule.repasse_model === 'fixed' ? 'Fixo' : 'Híbrido'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 font-[500]">
                    {['percentage', 'hybrid'].includes(rule.repasse_model) ? `${rule.percentage_value}%` : '-'}
                  </TableCell>
                  <TableCell className="py-4 font-[500]">
                    {['fixed', 'hybrid'].includes(rule.repasse_model) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rule.fixed_amount) : '-'}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-[600] ${rule.active_status ? 'orvium-badge-success' : 'bg-slate-100 text-slate-600'}`}>
                      {rule.active_status ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex justify-end items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(rule)} className="text-slate-400 hover:text-primary hover:bg-blue-50 transition-colors">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)} className="text-slate-400 hover:text-destructive hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-[700] text-xl">
              {editingRule ? 'Editar Regra de Repasse' : 'Nova Regra de Repasse'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="rule_name">Nome da Regra *</Label>
              <Input id="rule_name" required value={formData.rule_name} onChange={e => setFormData({...formData, rule_name: e.target.value})} className="bg-slate-50" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="repasse_model">Modelo de Repasse *</Label>
              <select 
                id="repasse_model"
                className="flex h-11 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.repasse_model}
                onChange={(e) => setFormData({...formData, repasse_model: e.target.value})}
              >
                <option value="percentage">Percentual</option>
                <option value="fixed">Valor Fixo</option>
                <option value="hybrid">Híbrido (Percentual + Fixo)</option>
              </select>
            </div>

            {['percentage', 'hybrid'].includes(formData.repasse_model) && (
              <div className="space-y-2">
                <Label htmlFor="percentage_value">Percentual (%) *</Label>
                <Input id="percentage_value" type="number" step="0.01" min="0" max="100" required value={formData.percentage_value} onChange={e => setFormData({...formData, percentage_value: e.target.value})} className="bg-slate-50" />
              </div>
            )}

            {['fixed', 'hybrid'].includes(formData.repasse_model) && (
              <div className="space-y-2">
                <Label htmlFor="fixed_amount">Valor Fixo (R$) *</Label>
                <Input id="fixed_amount" type="number" step="0.01" min="0" required value={formData.fixed_amount} onChange={e => setFormData({...formData, fixed_amount: e.target.value})} className="bg-slate-50" />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="active_status" className="cursor-pointer">Regra Ativa</Label>
              <Switch 
                id="active_status" 
                checked={formData.active_status} 
                onCheckedChange={(checked) => setFormData({...formData, active_status: checked})} 
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="orvium-btn-primary font-[600]">Salvar Regra</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepasseRulesPage;
