import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Settings, 
  Database, 
  Activity,
  Building,
  RefreshCw,
  BarChart3,
  Zap,
  Bell,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useERPIntegration } from '../hooks/useERPIntegration';
import ApiKeyForm from './ApiKeyForm';
import BookDetailsModal from './BookDetailsModal';
import ERPCard from './ERPCard';
import SmartDashboard from './SmartDashboard';
import AdvancedBookGenerator from './AdvancedBookGenerator';
import type { 
  Company, 
  Book, 
  ERPOption, 
  SyncHistoryEntry, 
  ApiKeys
} from '../types';
import { generateBookFile } from '../utils/fileGenerator';

const Dashboard = () => {
  const [selectedERP, setSelectedERP] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [companies] = useState<Company[]>([
    { id: 1, name: 'Empresa Exemplo Ltda', cnpj: '12.345.678/0001-90', status: 'Ativo' }
  ]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>('erp-api-keys', {});
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [currentERPConfig, setCurrentERPConfig] = useState<ERPOption | null>(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    connectionStatus,
    integrationData,
    isSyncing,
    testConnection,
    syncData,
    setConnectionStatus
  } = useERPIntegration();

  const erpOptions: ERPOption[] = [
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

  const requiredBooks: Book[] = [
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

  const addSyncHistory = (message: string) => {
    setSyncHistory(prev => [{
      id: Date.now(),
      message,
      timestamp: new Date().toISOString()
    }, ...prev.slice(0, 9)]);
  };

  const openApiKeyModal = (erpType: string) => {
    setCurrentERPConfig(erpOptions.find(e => e.value === erpType) || null);
    setShowApiKeyModal(true);
  };

  const saveApiKeys = (erpType: string, keys: Record<string, string>) => {
    setApiKeys(prev => ({ ...prev, [erpType]: keys }));
    setShowApiKeyModal(false);
    const currentERP = erpOptions.find(e => e.value === erpType);
    if (currentERP) {
      addSyncHistory(`Chaves de API configuradas para ${currentERP.label}`);
      toast({
        title: "Sucesso",
        description: `Chaves configuradas para ${currentERP.label}`,
      });
    }
  };

  const handleERPTest = async (erpType: string) => {
    const erp = erpOptions.find(e => e.value === erpType);
    const keys = apiKeys[erpType];
    
    if (!keys || !erp) {
      toast({
        title: "Erro",
        description: "Configure as chaves de API primeiro",
        variant: "destructive"
      });
      return;
    }

    const success = await testConnection(erpType, erp, keys);
    if (success) {
      addSyncHistory(`Conexão com ${erp.label} estabelecida com sucesso`);
    } else {
      addSyncHistory(`Erro ao conectar com ${erp.label}`);
    }
  };

  const handleERPSync = async (erpType: string) => {
    const erp = erpOptions.find(e => e.value === erpType);
    if (!erp) return;

    addSyncHistory(`Iniciando sincronização com ${erp.label}...`);
    const data = await syncData(erpType, erp);
    
    if (data) {
      addSyncHistory(`Sincronização com ${erp.label} concluída - ${data.sales?.length || 0} vendas, ${data.purchases?.length || 0} compras`);
    }
  };

  const handleGenerateBooks = async (config: any) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Simular progresso de geração
      const progressSteps = [20, 40, 60, 80, 100];
      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setGenerationProgress(step);
      }

      // Gerar livros baseados na configuração
      const generatedBooks: Book[] = config.bookTypes.map((bookType: string) => ({
        name: `Livro ${bookType.charAt(0).toUpperCase() + bookType.slice(1)}`,
        description: `Livro contábil gerado automaticamente`,
        required: ['caixa', 'inventario', 'compras'].includes(bookType),
        status: 'completed' as const,
        generatedAt: new Date().toISOString(),
        fileName: `${bookType}_${config.period.start}_${config.period.end}.${config.format}`,
        recordCount: Math.floor(Math.random() * 500) + 100,
        format: config.format,
        period: `${config.period.start} a ${config.period.end}`
      }));

      setBooks(generatedBooks);
      toast({
        title: "Sucesso!",
        description: `${generatedBooks.length} livros contábeis gerados com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao gerar livros contábeis",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const openBookDetails = (book: Book) => {
    setSelectedBook(book);
    setShowBookDetails(true);
  };

  const updateBook = (updatedBook: Book) => {
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.name === updatedBook.name ? updatedBook : book
      )
    );
    toast({
      title: "Sucesso",
      description: "Detalhes do livro atualizados!",
    });
  };

  const downloadBook = (book: Book) => {
    try {
      generateBookFile(book, book.format || 'pdf');
      toast({
        title: "Download concluído",
        description: `Arquivo ${book.fileName} baixado com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Falha ao baixar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const connectedERPs = erpOptions.filter(erp => erp.status === 'connected');
  const stats = [
    { title: 'Empresas Ativas', value: companies.length.toString(), icon: Building, color: 'text-blue-600' },
    { title: 'Livros Gerados', value: books.length.toString(), icon: FileText, color: 'text-green-600' },
    { title: 'ERPs Conectados', value: connectedERPs.length.toString(), icon: Database, color: 'text-purple-600' },
    { title: 'Última Sync', value: syncHistory[0] ? 'Hoje' : 'Nunca', icon: RefreshCw, color: 'text-emerald-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header Aprimorado */}
      <header className="bg-white shadow-sm border-b backdrop-blur-lg bg-white/90">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-3 shadow-lg">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contabilidade Inteligente</h1>
                <p className="text-sm text-gray-500">Simples Nacional - Automação Contábil Avançada</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar livros, relatórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notificações
              </Button>
              <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-blue-100">
                {new Date().toLocaleDateString('pt-BR')}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Gerar Livros</span>
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Meus Livros</span>
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
            <SmartDashboard integrationData={integrationData} />
          </TabsContent>

          <TabsContent value="generate" className="space-y-6 mt-6">
            <AdvancedBookGenerator
              availableERPs={connectedERPs.map(erp => erp.value)}
              integrationData={integrationData}
              onGenerateBooks={handleGenerateBooks}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
            />
          </TabsContent>

          <TabsContent value="books" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meus Livros Contábeis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {books.length > 0 ? (
                    books.map((book, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-green-500" />
                          <div>
                            <h4 className="font-medium text-gray-900">{book.name}</h4>
                            <p className="text-sm text-gray-500">{book.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {book.recordCount} registros
                          </Badge>
                          <Button
                            onClick={() => openBookDetails(book)}
                            size="sm"
                            variant="outline"
                          >
                            Ver Detalhes
                          </Button>
                          <Button
                            onClick={() => downloadBook(book)}
                            size="sm"
                            variant="outline"
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Nenhum livro gerado ainda. Vá para a aba "Gerar Livros" para começar.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Integrações ERP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {erpOptions.map(erp => (
                    <ERPCard
                      key={erp.value}
                      erp={erp}
                      onConfigureKeys={() => openApiKeyModal(erp.value)}
                      onTestConnection={() => handleERPTest(erp.value)}
                      onSyncData={() => handleERPSync(erp.value)}
                      isConfigured={!!apiKeys[erp.value]}
                      isSyncing={isSyncing}
                      lastSyncData={integrationData[erp.value]}
                    />
                  ))}
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
                <CardTitle>Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Configurações Gerais</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Backup automático</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Notificações por email</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Validação automática</span>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modais */}
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          isOpen={showBookDetails}
          onClose={() => setShowBookDetails(false)}
          onSave={updateBook}
          onDownload={downloadBook}
        />
      )}

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
