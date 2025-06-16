
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Settings, 
  Database, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Building,
  Users,
  DollarSign,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Key,
  Link,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import ApiKeyForm from './ApiKeyForm';

const Dashboard = () => {
  const [selectedERP, setSelectedERP] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [companies, setCompanies] = useState([
    { id: 1, name: 'Empresa Exemplo Ltda', cnpj: '12.345.678/0001-90', status: 'Ativo' }
  ]);
  const [books, setBooks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [integrationData, setIntegrationData] = useState({});
  const [apiKeys, setApiKeys] = useState({});
  const [connectionStatus, setConnectionStatus] = useState({});
  const [syncHistory, setSyncHistory] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [currentERPConfig, setCurrentERPConfig] = useState(null);

  const erpOptions = [
    { 
      value: 'bling', 
      label: 'Bling ERP', 
      color: 'bg-blue-500',
      status: connectionStatus.bling || 'disconnected',
      apiEndpoint: 'https://bling.com.br/Api/v2/',
      requiredFields: ['apiKey'],
      description: 'ERP completo para e-commerce e varejo'
    },
    { 
      value: 'tiny', 
      label: 'Tiny ERP', 
      color: 'bg-green-500',
      status: connectionStatus.tiny || 'disconnected',
      apiEndpoint: 'https://api.tiny.com.br/api2/',
      requiredFields: ['token', 'formato'],
      description: 'Gestão empresarial integrada'
    },
    { 
      value: 'omie', 
      label: 'Omie', 
      color: 'bg-purple-500',
      status: connectionStatus.omie || 'disconnected',
      apiEndpoint: 'https://app.omie.com.br/api/v1/',
      requiredFields: ['appKey', 'appSecret'],
      description: 'Sistema de gestão empresarial na nuvem'
    },
    { 
      value: 'granatum', 
      label: 'Granatum', 
      color: 'bg-orange-500',
      status: connectionStatus.granatum || 'disconnected',
      apiEndpoint: 'https://api.granatum.com.br/v1/',
      requiredFields: ['apiKey'],
      description: 'Controle financeiro empresarial'
    },
    { 
      value: 'conta_azul', 
      label: 'ContaAzul', 
      color: 'bg-cyan-500',
      status: connectionStatus.conta_azul || 'disconnected',
      apiEndpoint: 'https://api.contaazul.com/',
      requiredFields: ['clientId', 'clientSecret'],
      description: 'Gestão financeira para PMEs'
    },
    { 
      value: 'sage', 
      label: 'Sage', 
      color: 'bg-indigo-500',
      status: connectionStatus.sage || 'disconnected',
      apiEndpoint: 'https://api.sage.com/v1/',
      requiredFields: ['apiKey', 'companyId'],
      description: 'Soluções de gestão empresarial'
    }
  ];

  const requiredBooks = [
    {
      name: 'Livro Caixa',
      description: 'Registro de todas as movimentações financeiras',
      required: true,
      status: 'pending'
    },
    {
      name: 'Livro Registro de Inventário',
      description: 'Controle de estoque e inventário',
      required: true,
      status: 'pending'
    },
    {
      name: 'Livro Registro de Compras',
      description: 'Registro de todas as compras realizadas',
      required: true,
      status: 'pending'
    },
    {
      name: 'Livro de Apuração do Lucro Real',
      description: 'Para empresas optantes pelo Lucro Real',
      required: false,
      status: 'pending'
    }
  ];

  const testConnection = async (erpType) => {
    const erp = erpOptions.find(e => e.value === erpType);
    const keys = apiKeys[erpType];
    
    if (!keys) {
      toast({
        title: "Erro",
        description: "Configure as chaves de API primeiro",
        variant: "destructive"
      });
      return;
    }

    try {
      setConnectionStatus(prev => ({ ...prev, [erpType]: 'testing' }));
      
      // Simulação de teste de conexão
      const response = await simulateAPICall(erp, keys, 'test');
      
      if (response.success) {
        setConnectionStatus(prev => ({ ...prev, [erpType]: 'connected' }));
        addSyncHistory(`Conexão com ${erp.label} estabelecida com sucesso`);
        toast({
          title: "Sucesso",
          description: `Conectado ao ${erp.label}`,
        });
      } else {
        setConnectionStatus(prev => ({ ...prev, [erpType]: 'error' }));
        addSyncHistory(`Erro ao conectar com ${erp.label}: ${response.error}`);
        toast({
          title: "Erro",
          description: response.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [erpType]: 'error' }));
      addSyncHistory(`Erro ao conectar com ${erp.label}: ${error.message}`);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const syncData = async (erpType) => {
    const erp = erpOptions.find(e => e.value === erpType);
    const keys = apiKeys[erpType];
    
    if (connectionStatus[erpType] !== 'connected') {
      toast({
        title: "Erro",
        description: "Estabeleça conexão primeiro",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    addSyncHistory(`Iniciando sincronização com ${erp.label}...`);

    try {
      // Buscar dados do ERP
      const salesData = await fetchERPData(erp, keys, 'sales');
      const purchaseData = await fetchERPData(erp, keys, 'purchases');
      const inventoryData = await fetchERPData(erp, keys, 'inventory');
      const financialData = await fetchERPData(erp, keys, 'financial');

      // Armazenar dados integrados
      setIntegrationData(prev => ({
        ...prev,
        [erpType]: {
          sales: salesData,
          purchases: purchaseData,
          inventory: inventoryData,
          financial: financialData,
          lastSync: new Date().toISOString()
        }
      }));

      addSyncHistory(`Sincronização com ${erp.label} concluída - ${salesData.length} vendas, ${purchaseData.length} compras`);
      toast({
        title: "Sucesso",
        description: `Dados sincronizados com ${erp.label}`,
      });
    } catch (error) {
      addSyncHistory(`Erro na sincronização com ${erp.label}: ${error.message}`);
      toast({
        title: "Erro",
        description: `Erro na sincronização: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const simulateAPICall = async (erp, keys, endpoint) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const hasValidKeys = Object.values(keys).every(key => key && key.length > 0);
        resolve({
          success: hasValidKeys,
          error: hasValidKeys ? null : 'Chaves de API inválidas'
        });
      }, 1000);
    });
  };

  const fetchERPData = async (erp, keys, dataType) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = generateMockData(erp.value, dataType);
        resolve(mockData);
      }, 2000);
    });
  };

  const generateMockData = (erpType, dataType) => {
    const baseData = {
      sales: [
        { id: 1, date: '2024-01-15', customer: 'Cliente A', value: 1500.00, items: 3 },
        { id: 2, date: '2024-01-16', customer: 'Cliente B', value: 2300.50, items: 5 },
        { id: 3, date: '2024-01-17', customer: 'Cliente C', value: 890.75, items: 2 }
      ],
      purchases: [
        { id: 1, date: '2024-01-10', supplier: 'Fornecedor X', value: 5000.00, items: 10 },
        { id: 2, date: '2024-01-12', supplier: 'Fornecedor Y', value: 3200.00, items: 7 }
      ],
      inventory: [
        { id: 1, product: 'Produto A', quantity: 150, unitValue: 25.00 },
        { id: 2, product: 'Produto B', quantity: 89, unitValue: 45.50 },
        { id: 3, product: 'Produto C', quantity: 200, unitValue: 12.75 }
      ],
      financial: [
        { id: 1, date: '2024-01-15', type: 'receita', description: 'Venda', value: 1500.00 },
        { id: 2, date: '2024-01-16', type: 'despesa', description: 'Compra', value: -800.00 }
      ]
    };
    
    return baseData[dataType] || [];
  };

  const addSyncHistory = (message) => {
    setSyncHistory(prev => [{
      id: Date.now(),
      message,
      timestamp: new Date().toISOString()
    }, ...prev.slice(0, 9)]);
  };

  const openApiKeyModal = (erpType) => {
    setCurrentERPConfig(erpOptions.find(e => e.value === erpType));
    setShowApiKeyModal(true);
  };

  const saveApiKeys = (erpType, keys) => {
    setApiKeys(prev => ({ ...prev, [erpType]: keys }));
    setShowApiKeyModal(false);
    addSyncHistory(`Chaves de API configuradas para ${currentERPConfig.label}`);
    toast({
      title: "Sucesso",
      description: `Chaves configuradas para ${currentERPConfig.label}`,
    });
  };

  const generateBooks = () => {
    if (!selectedERP || !selectedPeriod) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o ERP e o período",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      const generatedBooks = requiredBooks.map(book => ({
        ...book,
        status: 'completed',
        generatedAt: new Date().toISOString(),
        fileName: `${book.name.replace(/\s+/g, '_')}_${selectedPeriod}.pdf`,
        recordCount: Math.floor(Math.random() * 500) + 50
      }));
      
      setBooks(generatedBooks);
      setIsGenerating(false);
      toast({
        title: "Sucesso",
        description: "Livros contábeis gerados com sucesso!",
      });
    }, 3000);
  };

  const downloadBook = (book) => {
    toast({
      title: "Download iniciado",
      description: `Baixando: ${book.fileName}`,
    });
  };

  const stats = [
    { title: 'Empresas Ativas', value: '1', icon: Building, color: 'text-blue-600' },
    { title: 'Livros Gerados', value: books.length.toString(), icon: FileText, color: 'text-green-600' },
    { title: 'ERPs Conectados', value: Object.values(connectionStatus).filter(s => s === 'connected').length.toString(), icon: Database, color: 'text-purple-600' },
    { title: 'Última Sync', value: syncHistory[0] ? 'Hoje' : 'Nunca', icon: RefreshCw, color: 'text-emerald-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-2">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Livros Contábeis</h1>
                <p className="text-sm text-gray-500">Simples Nacional - Automação Contábil</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                Período Atual: {new Date().toLocaleDateString('pt-BR')}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Gerar Livros</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Integrações</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Empresas</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {books.length > 0 ? (
                    books.slice(0, 5).map((book, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-600">
                          {book.name} gerado com sucesso
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(book.generatedAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma atividade recente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerar Livros Contábeis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="erp-select">Selecionar ERP</Label>
                    <Select value={selectedERP} onValueChange={setSelectedERP}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um ERP" />
                      </SelectTrigger>
                      <SelectContent>
                        {erpOptions.map(erp => (
                          <SelectItem key={erp.value} value={erp.value}>
                            {erp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="period-input">Período</Label>
                    <Input
                      id="period-input"
                      type="month"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={generateBooks}
                  disabled={isGenerating || !selectedERP || !selectedPeriod}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Gerando...' : 'Gerar Livros'}
                </Button>
              </CardContent>
            </Card>

            {/* Books Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status dos Livros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(books.length > 0 ? books : requiredBooks).map((book, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        {book.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{book.name}</h4>
                          <p className="text-sm text-gray-500">{book.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {book.status === 'completed' && (
                          <>
                            <Badge variant="secondary">
                              {book.recordCount} registros
                            </Badge>
                            <Button
                              onClick={() => downloadBook(book)}
                              size="sm"
                              variant="outline"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </>
                        )}
                        <Badge variant={book.status === 'completed' ? 'default' : 'secondary'}>
                          {book.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 mt-6">
            {/* Status das Integrações */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Status das Integrações</CardTitle>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {erpOptions.map(erp => (
                    <Card key={erp.value} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${erp.color}`}></div>
                            <h4 className="font-medium text-gray-900">{erp.label}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            {erp.status === 'connected' && <Wifi className="h-4 w-4 text-green-500" />}
                            {erp.status === 'disconnected' && <WifiOff className="h-4 w-4 text-gray-400" />}
                            {erp.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            {erp.status === 'testing' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-4">{erp.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Status:</span>
                            <Badge variant={
                              erp.status === 'connected' ? 'default' :
                              erp.status === 'error' ? 'destructive' :
                              erp.status === 'testing' ? 'secondary' :
                              'outline'
                            }>
                              {erp.status === 'connected' ? 'Conectado' :
                               erp.status === 'error' ? 'Erro' :
                               erp.status === 'testing' ? 'Testando...' :
                               'Desconectado'}
                            </Badge>
                          </div>
                          
                          {integrationData[erp.value] && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Última Sync:</span>
                              <span className="text-xs text-gray-600">
                                {new Date(integrationData[erp.value].lastSync).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openApiKeyModal(erp.value)}
                              className="flex-1"
                            >
                              <Key className="h-3 w-3 mr-1" />
                              Configurar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testConnection(erp.value)}
                              disabled={!apiKeys[erp.value] || erp.status === 'testing'}
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
                              onClick={() => syncData(erp.value)}
                              disabled={isSyncing}
                              className="w-full"
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Sincronização */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncHistory.length > 0 ? (
                    syncHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{entry.message}</p>
                          <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">Nenhuma sincronização realizada ainda</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Empresas Cadastradas</CardTitle>
                <Button>Adicionar Empresa</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companies.map(company => (
                    <div key={company.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{company.name}</h4>
                          <p className="text-sm text-gray-500">CNPJ: {company.cnpj}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">{company.status}</Badge>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Configurações Gerais</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="backup">Backup automático</Label>
                      <input id="backup" type="checkbox" className="rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Notificações por email</Label>
                      <input id="notifications" type="checkbox" className="rounded" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="validation">Validação automática</Label>
                      <input id="validation" type="checkbox" className="rounded" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Configurações de Integração</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sync-frequency">Frequência de Sincronização</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">A cada hora</SelectItem>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de Configuração de API */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Configurar {currentERPConfig?.label}
            </DialogTitle>
          </DialogHeader>
          
          {currentERPConfig && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>Endpoint: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{currentERPConfig.apiEndpoint}</code></p>
                <p>Campos obrigatórios: {currentERPConfig.requiredFields.join(', ')}</p>
              </div>
              
              <ApiKeyForm
                erpType={currentERPConfig.value}
                requiredFields={currentERPConfig.requiredFields}
                onSave={saveApiKeys}
                onCancel={() => setShowApiKeyModal(false)}
                currentKeys={apiKeys[currentERPConfig.value] || {}}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
