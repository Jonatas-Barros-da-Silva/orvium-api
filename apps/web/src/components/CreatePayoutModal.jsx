
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, AlertCircle } from 'lucide-react';

const CreatePayoutModal = ({ isOpen, onClose, onSuccess }) => {
  const [professionals, setProfessionals] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    professional_id: '',
    payout_amount: '',
    reference_period: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Reset form
      setFormData({
        professional_id: '',
        payout_amount: '',
        reference_period: new Date().toISOString().slice(0, 7), // YYYY-MM
        description: ''
      });
      setError('');
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profsData, balancesData] = await Promise.all([
        pb.collection('professionals').getFullList({ filter: 'active_status=true', $autoCancel: false }),
        pb.collection('professional_balances').getFullList({ $autoCancel: false })
      ]);

      setProfessionals(profsData);

      const balMap = {};
      balancesData.forEach(b => {
        balMap[b.professional_id] = {
          balance: b.current_balance,
          org_id: b.organization_id
        };
      });
      setBalances(balMap);
    } catch (err) {
      console.error("Error fetching data for payout modal:", err);
      setError("Erro ao carregar dados dos profissionais.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProfBalance = formData.professional_id ? balances[formData.professional_id]?.balance || 0 : 0;
  const selectedProfOrg = formData.professional_id ? balances[formData.professional_id]?.org_id || professionals.find(p => p.professional_id === formData.professional_id)?.organization_id : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amount = Number(formData.payout_amount);
    
    if (!formData.professional_id) {
      setError("Selecione um profissional.");
      return;
    }
    if (amount <= 0) {
      setError("O valor deve ser maior que zero.");
      return;
    }
    if (amount > selectedProfBalance) {
      setError("O valor do pagamento não pode ser maior que o saldo atual do profissional.");
      return;
    }
    if (!formData.reference_period) {
      setError("Informe o período de referência.");
      return;
    }

    setSubmitting(true);
    try {
      const payoutId = `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await pb.collection('payouts').create({
        payout_id: payoutId,
        organization_id: selectedProfOrg || 'ORG-DEFAULT',
        professional_id: formData.professional_id,
        payout_amount: amount,
        payout_status: 'pending',
        reference_period: formData.reference_period,
        // description is not in schema, but we could add it to a metadata json if needed. Ignoring for now as per schema.
      }, { $autoCancel: false });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating payout:", err);
      setError("Erro ao criar solicitação de pagamento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Nova Solicitação de Pagamento
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-slate-500">Carregando dados...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="professional">Profissional *</Label>
              <select 
                id="professional"
                className="flex h-11 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.professional_id}
                onChange={(e) => setFormData({...formData, professional_id: e.target.value})}
                required
              >
                <option value="">Selecione um profissional...</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.professional_id}>
                    {p.professional_name} (Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balances[p.professional_id]?.balance || 0)})
                  </option>
                ))}
              </select>
            </div>

            {formData.professional_id && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">Saldo Disponível:</span>
                <span className="text-lg font-bold text-blue-900 font-mono-num">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProfBalance)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor a Pagar (R$) *</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  max={selectedProfBalance > 0 ? selectedProfBalance : 0.01}
                  required 
                  value={formData.payout_amount} 
                  onChange={e => setFormData({...formData, payout_amount: e.target.value})} 
                  className="bg-slate-50 font-mono-num" 
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Período Ref. *</Label>
                <Input 
                  id="period" 
                  type="month" 
                  required 
                  value={formData.reference_period} 
                  onChange={e => setFormData({...formData, reference_period: e.target.value})} 
                  className="bg-slate-50" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Observações (Opcional)</Label>
              <Input 
                id="desc" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="bg-slate-50" 
                placeholder="Ex: Pagamento referente a comissões de Janeiro"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
              <Button type="submit" className="orvium-btn-primary" disabled={submitting || !formData.professional_id || selectedProfBalance <= 0}>
                {submitting ? 'Criando...' : 'Criar Solicitação'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePayoutModal;
