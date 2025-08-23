
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ERPOption, ConnectionStatus, ApiKeys, IntegrationData } from '../types/index';

export const useERPIntegration = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  const [integrationData, setIntegrationData] = useState<IntegrationData>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const testConnection = useCallback(async (erpType: string, erp: ERPOption, keys: Record<string, string>) => {
    try {
      console.log(`Testing connection for ${erpType} with keys:`, Object.keys(keys));
      setConnectionStatus(prev => ({ ...prev, [erpType]: 'testing' }));
      
      // Para Bling, extrair a versão do erpType e usar sempre 'bling-integration'
      const isBlingo = erpType.startsWith('bling');
      const version = isBlingo ? erpType.split('-')[1] || 'v3' : undefined;
      const functionName = isBlingo ? 'bling-integration' : `${erpType}-integration`;
      
      const body = { 
        action: 'test',
        ...(version && { version }),
        ...keys
      };
      
      console.log(`Calling function ${functionName} with body:`, body);
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
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
        
        // Mensagem de erro mais específica
        let errorMessage = data?.error || 'Erro desconhecido';
        
        // Mapear erros comuns para mensagens mais amigáveis
        if (errorMessage.includes('conta foi inativada')) {
          errorMessage = 'Sua conta no Bling está inativa. Verifique sua situação junto ao suporte do Bling.';
        } else if (errorMessage.includes('API Key') || errorMessage.includes('Access Token')) {
          errorMessage = 'Credenciais inválidas. Verifique sua API Key ou Access Token.';
        } else if (errorMessage.includes('limite de requisições')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
        }
        
        toast({
          title: "Falha na Conexão",
          description: errorMessage,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus(prev => ({ ...prev, [erpType]: 'error' }));
      
      let errorMessage = 'Erro de comunicação com o servidor';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Erro de Conexão",
        description: errorMessage,
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
      console.log(`Starting data sync for ${erpType}`);
      
      // Get stored keys from localStorage for the sync
      const storedKeys = localStorage.getItem(`erpKeys_${erpType}`);
      const keys = storedKeys ? JSON.parse(storedKeys) : {};

      console.log(`Using stored keys for sync:`, Object.keys(keys));

      // Para Bling, extrair a versão do erpType e usar sempre 'bling-integration'
      const isBlingo = erpType.startsWith('bling');
      const version = isBlingo ? erpType.split('-')[1] || 'v3' : undefined;
      const functionName = isBlingo ? 'bling-integration' : `${erpType}-integration`;
      
      const body = { 
        action: 'sync',
        ...(version && { version }),
        ...keys
      };

      console.log(`Calling sync function ${functionName} with body:`, body);

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      console.log('Sync response:', { data, error });

      if (error) {
        console.error('Sync error:', error);
        throw error;
      }
      
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
      console.error('Sync process error:', error);
      
      let errorMessage = 'Falha ao sincronizar dados';
      
      if (error.message) {
        errorMessage = `Falha ao sincronizar dados: ${error.message}`;
      }
      
      toast({
        title: "Erro na Sincronização",
        description: errorMessage,
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
