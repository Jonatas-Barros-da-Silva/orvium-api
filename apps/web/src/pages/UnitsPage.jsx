
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, MapPin } from 'lucide-react';

const UnitsPage = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    unit_id: '',
    organization_id: '',
    unit_name: '',
    location: '',
    status: 'active'
  });

  const fetchUnits = async () => {
    try {
      const records = await pb.collection('units').getFullList({ sort: '-created', $autoCancel: false });
      setUnits(records);
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pb.collection('units').create(formData, { $autoCancel: false });
      setIsDialogOpen(false);
      setFormData({ unit_id: '', organization_id: '', unit_name: '', location: '', status: 'active' });
      fetchUnits();
    } catch (error) {
      console.error("Error creating unit:", error);
      alert("Erro ao criar unidade.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta unidade?')) {
      try {
        await pb.collection('units').delete(id, { $autoCancel: false });
        fetchUnits();
      } catch (error) {
        console.error("Error deleting unit:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-[700] tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Unidades
          </h1>
          <p className="text-muted-foreground mt-1 font-[400]">Gerencie as unidades físicas das organizações.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="orvium-btn-primary font-[600]">
              <Plus className="w-4 h-4 mr-2" /> Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-[700] text-xl">Cadastrar Nova Unidade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="unit_id">ID da Unidade *</Label>
                <Input id="unit_id" required value={formData.unit_id} onChange={e => setFormData({...formData, unit_id: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization_id">ID da Organização *</Label>
                <Input id="organization_id" required value={formData.organization_id} onChange={e => setFormData({...formData, organization_id: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_name">Nome da Unidade *</Label>
                <Input id="unit_name" required value={formData.unit_name} onChange={e => setFormData({...formData, unit_name: e.target.value})} className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input id="location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-slate-50" />
              </div>
              <Button type="submit" className="w-full orvium-btn-primary font-[600] h-11">Salvar Unidade</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="orvium-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-[600] text-slate-600 py-4">ID Unidade</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Nome</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">ID Organização</TableHead>
              <TableHead className="font-[600] text-slate-600 py-4">Status</TableHead>
              <TableHead className="text-right font-[600] text-slate-600 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Carregando dados...</TableCell></TableRow>
            ) : units.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-500">Nenhuma unidade encontrada.</TableCell></TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id} className="orvium-table-row">
                  <TableCell className="font-[600] text-slate-700 py-4">{unit.unit_id}</TableCell>
                  <TableCell className="py-4">{unit.unit_name}</TableCell>
                  <TableCell className="py-4 text-slate-500">{unit.organization_id}</TableCell>
                  <TableCell className="py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-[600] ${unit.status === 'active' ? 'bg-green-100 text-[hsl(var(--credit))]' : 'bg-slate-100 text-slate-600'}`}>
                      {unit.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(unit.id)} className="text-slate-400 hover:text-destructive hover:bg-red-50 transition-colors">
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

export default UnitsPage;
