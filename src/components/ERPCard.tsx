
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw, 
  Key, 
  Link, 
  TrendingUp,
  Database
} from 'lucide-react';
import type { ERPOption, ERPData } from '../types';

interface ERPCardProps {
  erp: ERPOption;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'testing';
  integrationData?: ERPData;
  testConnection: (erpType: string, erp: ERPOption, keys: Record<string, string>) => Promise<boolean>;
  syncData: (erpType: string, erp: ERPOption) => Promise<ERPData | null>;
  setConnectionStatus: (status: any) => void;
  setIntegrationData: (data: any) => void;
}

const ERPCard: React.FC<ERPCardProps> = ({
  erp,
  connectionStatus,
  integrationData,
  testConnection,
  syncData,
  setConnectionStatus,
  setIntegrationData
}) => {
  const [isConfigured, setIsConfigured] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'testing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected': return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'error': return <Badge variant="destructive">Erro</Badge>;
      case 'testing': return <Badge variant="secondary">Testando...</Badge>;
      default: return <Badge variant="outline">Desconectado</Badge>;
    }
  };

  const handleConfigureKeys = () => {
    // Mock configuration - in real app this would open a modal
    setIsConfigured(true);
  };

  const handleTestConnection = async () => {
    const mockKeys = { apiKey: 'test-key', cnpj: '12345678000190' };
    await testConnection(erp.value, erp, mockKeys);
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    await syncData(erp.value, erp);
    setIsSyncing(false);
  };

  const syncProgress = integrationData ? 
    Math.min(100, (Object.keys(integrationData).length - 1) * 25) : 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: erp.color }}></div>
            <div>
              <h4 className="font-semibold text-gray-900">{erp.label}</h4>
              <p className="text-xs text-gray-500">{erp.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </div>

        {integrationData && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Dados Sincronizados</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Vendas:</span>
                <span className="font-medium">{integrationData.sales?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Compras:</span>
                <span className="font-medium">{integrationData.purchases?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Estoque:</span>
                <span className="font-medium">{integrationData.inventory?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Financeiro:</span>
                <span className="font-medium">{integrationData.financial?.length || 0}</span>
              </div>
            </div>
            <Progress value={syncProgress} className="mt-2 h-2" />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleConfigureKeys}
              className="flex-1"
            >
              <Key className="h-3 w-3 mr-1" />
              {isConfigured ? 'Reconfigurar' : 'Configurar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={!isConfigured || connectionStatus === 'testing'}
              className="flex-1"
            >
              <Link className="h-3 w-3 mr-1" />
              Testar
            </Button>
          </div>
          
          {connectionStatus === 'connected' && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSyncData}
              disabled={isSyncing}
              className="w-full"
            >
              <Database className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}
            </Button>
          )}
        </div>

        {integrationData && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Última Sync:</span>
              <span>{new Date(integrationData.lastSync).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ERPCard;
