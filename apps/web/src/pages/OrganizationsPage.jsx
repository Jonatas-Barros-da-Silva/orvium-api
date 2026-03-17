
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Building2 } from 'lucide-react';

const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    organization_id: '',
    organization_name: '',
    timezone: 'America/Sao_Paulo',
    financial_settings: '',
    payout_configuration: ''
  });

  const fetchOrganizations = async () => {
    try {
      const records = await pb.collection('organizations').getFullList({ sort: '-created', $autoCancel: false });
      setOrganizations(records);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('organizations').create(formData, { $autoCancel: false });
      setIsDialogOpen(false);
      setFormData({ organization_id: '', organization_name: '', timezone: 'America/Sao_Paulo', financial_settings: '', payout_configuration: '' });
      fetchOrganizations();
    } catch (error) {
      console.error("Error creating organization:", error);
      alert("Erro ao criar organização.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta organização?')) {
      try {
        await pb.collection('organizations').delete(id, { $autoCancel: false });
        fetchOrganizations();
      } catch (error) {
        console.error("Error deleting organization:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-[700] tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Organizações
          </h1>
          <p className="text-muted-foreground mt-1 font-[400]">Gerencie as organizações cadastradas no sistema.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="orvium-btn-primary font-[600]">
              <Plus className="w-4 h-4 mr-2" /> Nova Organização
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-[700] text-xl">Cadastrar Nova Organização</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="organization_id">ID da Organização *</Label>
                <Input id="organization_id" required value={formData.organization_id} onChange={e => setFormData({...formData, organization_id: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization_name">Nome da Organização *</Label>
                <Input id="organization_name" required value={formData.organization_name} onChange={e => setFormData({...formData, organization_name: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Input id="timezone" value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})} className="bg-slate-50" />
              </div>
              <Button type="submit" className="w-full orvium-btn-primary font-[600] h-11">Salvar Organização</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="orvium-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-[600] text-slate-600 py-4">ID</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Nome</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Fuso Horário</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Data de Criação</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Carregando dados...</TableCell></TableRow>
            ) : organizations.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Nenhuma organização encontrada.</TableCell></TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow key={org.id} className="orvium-table-row">
                  <TableCell className="font-[600] text-slate-700 py-4">{org.organization_id}</TableCell>
                  <TableCell className="py-4">{org.organization_name}</TableCell>
                  <TableCell className="py-4 text-slate-500">{org.timezone}</TableCell>
                  <TableCell className="py-4 text-slate-500">{new Date(org.created).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right py-4">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(org.id)} className="text-slate-400 hover:text-destructive hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrganizationsPage;
