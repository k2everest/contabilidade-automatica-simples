
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ERPOption, ConnectionStatus, ApiKeys, IntegrationData } from '../types';

export const useERPIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  const [integrationData, setIntegrationData] = useState<IntegrationData>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const testConnection = useCallback(async (erpType: string, erp: ERPOption, keys: Record<string, string>) => {
    try {
      setConnectionStatus(prev => ({ ...prev, [erpType]: 'testing' }));
      
      const { data, error } = await supabase.functions.invoke(`${erpType}-integration`, {
        body: { action: 'test', ...keys }
      });

      if (error) throw error;
      
      const success = data?.success || false;
      
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
          description: data?.error || 'Credenciais inválidas',
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [erpType]: 'error' }));
      toast({
        title: "Erro de Conexão",
        description: `Erro: ${error.message}`,
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
      // Get stored keys from localStorage for the sync
      const storedKeys = localStorage.getItem(`erpKeys_${erpType}`);
      const keys = storedKeys ? JSON.parse(storedKeys) : {};

      const { data, error } = await supabase.functions.invoke(`${erpType}-integration`, {
        body: { action: 'sync', ...keys }
      });

      if (error) throw error;
      
      if (data?.success && data?.data) {
        setIntegrationData(prev => ({ ...prev, [erpType]: data.data }));
        
        toast({
          title: "Sincronização Concluída",
          description: `Dados do ${erp.label} sincronizados com sucesso!`,
        });
        
        return data.data;
      } else {
        throw new Error(data?.error || 'Falha na sincronização');
      }
    } catch (error) {
      toast({
        title: "Erro na Sincronização",
        description: `Falha ao sincronizar dados: ${error.message}`,
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
