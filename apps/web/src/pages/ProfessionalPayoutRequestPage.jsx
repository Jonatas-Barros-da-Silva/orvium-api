
import React, { useState, useEffect } from 'react';
import { useProfessionalWallet } from '@/hooks/useProfessionalWallet.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

const ProfessionalPayoutRequestPage = () => {
  const { currentUser } = useAuth();
  const { balance, transactions, organizations, loading } = useProfessionalWallet();
  const { toast } = useToast();

  const [amount, setAmount] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [referencePeriod, setReferencePeriod] = useState(new Date().toISOString().slice(0, 7));
  const [description, setDescription] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Extract unique organizations where professional has funds
  const activeOrgs = React.useMemo(() => {
    const orgIds = new Set(transactions.map(t => t.organization_id));
    return organizations.filter(o => orgIds.has(o.organization_id));
  }, [transactions, organizations]);

  useEffect(() => {
    if (activeOrgs.length === 1 && !selectedOrg) {
      setSelectedOrg(activeOrgs[0].organization_id);
    }
  }, [activeOrgs, selectedOrg]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const numAmount = Number(amount);
    const available = balance?.available_balance || 0;

    if (!selectedOrg) {
      setError('Selecione uma organização.');
      return;
    }
    if (numAmount <= 0) {
      setError('O valor deve ser maior que zero.');
      return;
    }
    if (numAmount > available) {
      setError(`O valor solicitado (R$ ${numAmount}) excede seu saldo disponível (${formatCurrency(available)}).`);
      return;
    }

    setSubmitting(true);
    try {
      const payoutId = `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Combine reference period and description if needed, or just use reference period
      const finalRef = description ? `${referencePeriod} | ${description}` : referencePeriod;

      await pb.collection('payouts').create({
        payout_id: payoutId,
        organization_id: selectedOrg,
        professional_id: currentUser.id,
        payout_amount: numAmount,
        payout_status: 'pending',
        reference_period: finalRef
      }, { $autoCancel: false });

      setSuccess(true);
      setAmount('');
      setDescription('');
      
      toast({
        title: "Solicitação Enviada",
        description: "Sua solicitação de saque foi criada com sucesso e está pendente de aprovação.",
      });

    } catch (err) {
      console.error("Error creating payout request:", err);
      setError("Ocorreu um erro ao processar sua solicitação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Carregando dados...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Solicitar Saque</h1>
        <p className="text-slate-500 mt-1">Transfira seu saldo disponível para sua conta bancária cadastrada.</p>
      </div>

      <div className="prof-wallet-card bg-gradient-to-br from-blue-50 to-white border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800 uppercase tracking-wider mb-1">Saldo Disponível para Saque</p>
            <p className="text-4xl font-bold text-blue-900 font-mono-num">{formatCurrency(balance?.available_balance)}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="prof-wallet-card">
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="ml-2">
              Solicitação enviada com sucesso! Você pode acompanhar o status no seu Histórico Financeiro.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="org">Organização Origem *</Label>
            <select 
              id="org"
              className="flex h-11 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              required
              disabled={submitting}
            >
              <option value="" disabled>Selecione a organização...</option>
              {activeOrgs.map(org => (
                <option key={org.id} value={org.organization_id}>{org.organization_name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Selecione de qual organização deseja solicitar o repasse.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Saque (R$) *</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.01" 
                min="0.01"
                max={balance?.available_balance || 0}
                required 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className="bg-slate-50 font-mono-num text-lg h-11" 
                placeholder="0.00"
                disabled={submitting || (balance?.available_balance || 0) <= 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Período de Referência *</Label>
              <Input 
                id="period" 
                type="month" 
                required 
                value={referencePeriod} 
                onChange={e => setReferencePeriod(e.target.value)} 
                className="bg-slate-50 h-11" 
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Observações (Opcional)</Label>
            <Textarea 
              id="desc" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="bg-slate-50 resize-none" 
              placeholder="Ex: Referente aos plantões da primeira quinzena"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => {setAmount(''); setDescription(''); setError('');}} disabled={submitting}>
              Limpar
            </Button>
            <Button type="submit" className="orvium-btn-primary px-8" disabled={submitting || (balance?.available_balance || 0) <= 0}>
              {submitting ? 'Processando...' : 'Confirmar Solicitação'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfessionalPayoutRequestPage;
