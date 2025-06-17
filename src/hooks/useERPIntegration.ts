
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import type { ERPOption, ConnectionStatus, ApiKeys, IntegrationData } from '../types';

export const useERPIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  const [integrationData, setIntegrationData] = useState<IntegrationData>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const testConnection = useCallback(async (erpType: string, erp: ERPOption, keys: Record<string, string>) => {
    try {
      setConnectionStatus(prev => ({ ...prev, [erpType]: 'testing' }));
      
      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const hasValidKeys = Object.values(keys).every(key => key && key.length > 3);
      const success = hasValidKeys && Math.random() > 0.2; // 80% success rate for demo
      
      if (success) {
        setConnectionStatus(prev => ({ ...prev, [erpType]: 'connected' }));
        toast({
          title: "Conexão Estabelecida",
          description: `Conectado ao ${erp.label} com sucesso!`,
        });
        return true;
      } else {
        setConnectionStatus(prev => ({ ...prev, [erpType]: 'error' }));
        toast({
          title: "Falha na Conexão",
          description: hasValidKeys ? 'Servidor indisponível' : 'Credenciais inválidas',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [erpType]: 'error' }));
      toast({
        title: "Erro de Conexão",
        description: 'Erro inesperado na conexão',
        variant: "destructive"
      });
      return false;
    }
  }, []);

  const syncData = useCallback(async (erpType: string, erp: ERPOption) => {
    if (connectionStatus[erpType] !== 'connected') {
      toast({
        title: "Erro",
        description: "Estabeleça conexão primeiro",
        variant: "destructive"
      });
      return null;
    }

    setIsSyncing(true);
    try {
      // Simulate comprehensive data sync
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockData = {
        sales: Array.from({ length: 15 }, (_, i) => ({
          id: i + 1,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          customer: `Cliente ${String.fromCharCode(65 + i)}`,
          value: Math.random() * 5000 + 500,
          items: Math.floor(Math.random() * 10) + 1,
          status: Math.random() > 0.8 ? 'pending' : 'completed'
        })),
        purchases: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          supplier: `Fornecedor ${i + 1}`,
          value: Math.random() * 8000 + 1000,
          items: Math.floor(Math.random() * 15) + 1
        })),
        inventory: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          product: `Produto ${i + 1}`,
          quantity: Math.floor(Math.random() * 500) + 10,
          unitValue: Math.random() * 100 + 5,
          category: ['Eletrônicos', 'Roupas', 'Casa', 'Livros'][Math.floor(Math.random() * 4)]
        })),
        financial: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          type: Math.random() > 0.6 ? 'receita' : 'despesa',
          description: Math.random() > 0.5 ? 'Venda de produto' : 'Compra de material',
          value: (Math.random() > 0.6 ? 1 : -1) * (Math.random() * 3000 + 200),
          category: ['Vendas', 'Compras', 'Impostos', 'Salários'][Math.floor(Math.random() * 4)]
        })),
        lastSync: new Date().toISOString()
      };

      setIntegrationData(prev => ({ ...prev, [erpType]: mockData }));
      
      toast({
        title: "Sincronização Concluída",
        description: `Dados do ${erp.label} sincronizados com sucesso!`,
      });
      
      return mockData;
    } catch (error) {
      toast({
        title: "Erro na Sincronização",
        description: 'Falha ao sincronizar dados',
        variant: "destructive"
      });
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [connectionStatus]);

  return {
    connectionStatus,
    integrationData,
    isSyncing,
    testConnection,
    syncData,
    setConnectionStatus,
    setIntegrationData
  };
};
