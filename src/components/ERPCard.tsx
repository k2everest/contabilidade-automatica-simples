
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
import type { ERPOption } from '../types';

interface ERPCardProps {
  erp: ERPOption;
  onConfigureKeys: () => void;
  onTestConnection: () => void;
  onSyncData: () => void;
  isConfigured: boolean;
  isSyncing: boolean;
  lastSyncData?: any;
}

const ERPCard: React.FC<ERPCardProps> = ({
  erp,
  onConfigureKeys,
  onTestConnection,
  onSyncData,
  isConfigured,
  isSyncing,
  lastSyncData
}) => {
  const getStatusIcon = () => {
    switch (erp.status) {
      case 'connected': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'testing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (erp.status) {
      case 'connected': return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'error': return <Badge variant="destructive">Erro</Badge>;
      case 'testing': return <Badge variant="secondary">Testando...</Badge>;
      default: return <Badge variant="outline">Desconectado</Badge>;
    }
  };

  const syncProgress = lastSyncData ? 
    Math.min(100, (Object.keys(lastSyncData).length - 1) * 25) : 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${erp.color}`}></div>
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

        {lastSyncData && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Dados Sincronizados</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Vendas:</span>
                <span className="font-medium">{lastSyncData.sales?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Compras:</span>
                <span className="font-medium">{lastSyncData.purchases?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Estoque:</span>
                <span className="font-medium">{lastSyncData.inventory?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Financeiro:</span>
                <span className="font-medium">{lastSyncData.financial?.length || 0}</span>
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
              onClick={onConfigureKeys}
              className="flex-1"
            >
              <Key className="h-3 w-3 mr-1" />
              {isConfigured ? 'Reconfigurar' : 'Configurar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onTestConnection}
              disabled={!isConfigured || erp.status === 'testing'}
              className="flex-1"
            >
              <Link className="h-3 w-3 mr-1" />
              Testar
            </Button>
          </div>
          
          {erp.status === 'connected' && (
            <Button
              variant="default"
              size="sm"
              onClick={onSyncData}
              disabled={isSyncing}
              className="w-full"
            >
              <Database className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}
            </Button>
          )}
        </div>

        {lastSyncData && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Última Sync:</span>
              <span>{new Date(lastSyncData.lastSync).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ERPCard;
