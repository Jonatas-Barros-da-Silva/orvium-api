
import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';

export const useProfessionalWallet = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState({
    wallet: null,
    balance: null,
    transactions: [],
    organizations: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        // 1. Fetch Wallet
        const wallets = await pb.collection('professional_wallets').getFullList({
          filter: `professional_id="${currentUser.id}"`,
          $autoCancel: false
        });
        
        if (wallets.length === 0) {
          setData(prev => ({ ...prev, loading: false, error: 'Carteira não encontrada. Entre em contato com o administrador.' }));
          return;
        }
        
        const wallet = wallets[0];
        
        // 2. Fetch Balances, Transactions, and Organizations
        const [balances, transactions, orgs] = await Promise.all([
          pb.collection('wallet_balances').getFullList({ filter: `wallet_id="${wallet.wallet_id}"`, $autoCancel: false }),
          pb.collection('wallet_transactions').getFullList({ filter: `wallet_id="${wallet.wallet_id}"`, sort: '-created_at', $autoCancel: false }),
          pb.collection('organizations').getFullList({ $autoCancel: false })
        ]);

        setData({
          wallet,
          balance: balances[0] || { available_balance: 0, pending_balance: 0 },
          transactions,
          organizations: orgs,
          loading: false,
          error: null
        });
      } catch (err) {
        console.error("Error fetching professional wallet data:", err);
        setData(prev => ({ ...prev, loading: false, error: 'Erro ao carregar dados da carteira.' }));
      }
    };

    fetchData();
  }, [currentUser]);

  return data;
};
