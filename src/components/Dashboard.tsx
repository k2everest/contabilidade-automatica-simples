import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  TrendingUp,
  Building2,
  Calendar,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useERPIntegration } from '../hooks/useERPIntegration';
import { generateBookFile } from '../utils/fileGenerator';
import SmartDashboard from './SmartDashboard';
import AdvancedBookGenerator from './AdvancedBookGenerator';
import SimplesNacionalIntegration from './SimplesNacionalIntegration';
import BookDetailsModal from './BookDetailsModal';
import ERPCard from './ERPCard';
import type { Book, ERPOption, BookGenerationConfig } from '../types';

const Dashboard: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([
    { name: 'Livro Caixa', description: 'Registro diário de movimentações financeiras', required: true, status: 'pending' },
    { name: 'Registro de Inventário', description: 'Controle de estoque de produtos', required: true, status: 'pending' },
    { name: 'Registro de Compras', description: 'Entradas de mercadorias e serviços', required: true, status: 'pending' },
    { name: 'Registro de Vendas', description: 'Saídas de mercadorias e serviços', required: false, status: 'pending' },
    { name: 'Apuração do Lucro Real', description: 'Demonstração do lucro líquido ajustado', required: false, status: 'pending' },
    { name: 'Prestação de Serviços', description: 'Registro de serviços prestados a terceiros', required: false, status: 'pending' }
  ]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { connectionStatus, integrationData, testConnection, syncData, setConnectionStatus, setIntegrationData } = useERPIntegration();

  const erpOptions: ERPOption[] = [
    {
      value: 'bling',
      label: 'Bling',
      color: 'blue',
      status: 'disconnected',
      apiEndpoint: 'https://www.bling.com.br/Api/v3',
      requiredFields: ['accessToken'],
      description: 'Sistema de gestão empresarial completo com API REST'
    },
    {
      value: 'omie',
      label: 'Omie',
      color: 'green',
      status: 'disconnected',
      apiEndpoint: 'https://app.omie.com.br/api/v1',
      requiredFields: ['appKey', 'appSecret'],
      description: 'ERP online para pequenas e médias empresas'
    },
    {
      value: 'tiny',
      label: 'Tiny ERP',
      color: 'orange',
      status: 'disconnected',
      apiEndpoint: 'https://api.tiny.com.br/api2',
      requiredFields: ['token'],
      description: 'Gestão empresarial online simples e eficiente'
    },
    {
      value: 'contaazul',
      label: 'ContaAzul',
      color: 'purple',
      status: 'disconnected',
      apiEndpoint: 'https://api.contaazul.com',
      requiredFields: ['accessToken'],
      description: 'Gestão financeira e contábil para PMEs'
    },
    {
      value: 'nibo',
      label: 'Nibo',
      color: 'red',
      status: 'disconnected',
      apiEndpoint: 'https://app.nibo.com.br/api',
      requiredFields: ['clientId', 'clientSecret'],
      description: 'Plataforma de gestão financeira e contábil'
    },
    {
      value: 'alterdata',
      label: 'Alterdata',
      color: 'indigo',
      status: 'disconnected',
      apiEndpoint: 'https://api.alterdata.com.br',
      requiredFields: ['apiKey', 'companyId'],
      description: 'Soluções de gestão empresarial e fiscal'
    }
  ];

  // Mock company data for demonstration
  const mockCompany = {
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'Empresa Exemplo Ltda',
    municipio: 'São Paulo',
    uf: 'SP'
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleBookSave = (updatedBook: Book) => {
    setBooks(books.map(book => book.name === updatedBook.name ? updatedBook : book));
    setIsModalOpen(false);
    toast({
      title: "Livro atualizado",
      description: `As informações do livro ${updatedBook.name} foram atualizadas com sucesso.`,
    });
  };

  const handleBookDownload = (book: Book) => {
    setBooks(books.map(b => {
      if (b.name === book.name) {
        return { ...b, generatedAt: new Date().toISOString() };
      }
      return b;
    }));
  };

  const handleManualGeneration = (bookName: string) => {
    const bookToUpdate = books.find(book => book.name === bookName);
    if (bookToUpdate) {
      setIsGenerating(true);
      setGenerationProgress(30);

      setTimeout(() => {
        generateBookFile(bookToUpdate);
        setBooks(books.map(book => {
          if (book.name === bookName) {
            return { ...book, status: 'completed', generatedAt: new Date().toISOString() };
          }
          return book;
        }));
        setGenerationProgress(100);
        setIsGenerating(false);
        toast({
          title: "Livro gerado",
          description: `O livro ${bookName} foi gerado com sucesso!`,
        });
      }, 2000);
    }
  };

  const handleAdvancedGeneration = useCallback((config: BookGenerationConfig) => {
    setIsGenerating(true);
    setGenerationProgress(10);

    const totalSteps = config.bookTypes.length * 3;
    let completedSteps = 0;

    const updateProgress = () => {
      completedSteps++;
      const progress = Math.round((completedSteps / totalSteps) * 100);
      setGenerationProgress(progress);
    };

    setTimeout(() => {
      const generatedBooks = config.bookTypes.map(bookType => {
        updateProgress();
        const bookName = books.find(b => b.name.toLowerCase().includes(bookType.toLowerCase()))?.name || 'Livro Desconhecido';
        updateProgress();
        generateBookFile({ name: bookName });
        updateProgress();
        return { name: bookName, status: 'completed', generatedAt: new Date().toISOString() };
      });

      setBooks(prevBooks => {
        return prevBooks.map(book => {
          const generatedBook = generatedBooks.find(gb => book.name === gb.name);
          return generatedBook ? { ...book, status: 'completed', generatedAt: generatedBook.generatedAt } : book;
        });
      });

      setIsGenerating(false);
      setGenerationProgress(100);
      toast({
        title: "Livros gerados",
        description: `Os livros foram gerados com sucesso!`,
      });
    }, 2000);
  }, [books]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema Contábil Simples Nacional</h1>
              <p className="text-sm text-gray-600">Gestão automatizada de livros contábeis</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Simples Nacional
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {mockCompany.cnpj}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="books">Livros Contábeis</TabsTrigger>
            <TabsTrigger value="integrations">Integrações ERP</TabsTrigger>
            <TabsTrigger value="generator">Gerador Avançado</TabsTrigger>
            <TabsTrigger value="simples">Simples Nacional</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SmartDashboard 
              books={books}
              integrationData={integrationData}
              erpConnections={Object.keys(connectionStatus).filter(erp => connectionStatus[erp] === 'connected')}
            />
          </TabsContent>

          <TabsContent value="books">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span>Livros Contábeis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {books.map(book => (
                  <div key={book.name} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleBookClick(book)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{book.name}</h3>
                        <p className="text-sm text-gray-500">{book.description}</p>
                      </div>
                      {book.status === 'completed' ? (
                        <div className="flex items-center space-x-2 text-green-500">
                          <CheckCircle className="h-4 w-4" />
                          <span>Gerado</span>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          handleManualGeneration(book.name);
                        }} disabled={isGenerating}>
                          {isGenerating ? (
                            <>
                              <Clock className="mr-2 h-4 w-4 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Gerar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {book.status === 'completed' && (
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="text-xs text-gray-400">
                          <Calendar className="h-4 w-4 inline-block mr-1" />
                          Gerado em: {new Date(book.generatedAt || '').toLocaleString('pt-BR')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Gerando livros...</span>
                      <span className="text-sm text-gray-500">{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {erpOptions.map(erp => (
                <ERPCard
                  key={erp.value}
                  erp={erp}
                  connectionStatus={connectionStatus[erp.value] || 'disconnected'}
                  integrationData={integrationData[erp.value]}
                  testConnection={testConnection}
                  syncData={syncData}
                  setConnectionStatus={setConnectionStatus}
                  setIntegrationData={setIntegrationData}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="generator">
            <AdvancedBookGenerator
              availableERPs={Object.keys(connectionStatus).filter(erp => connectionStatus[erp] === 'connected')}
              integrationData={integrationData}
              onGenerateBooks={handleAdvancedGeneration}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
            />
          </TabsContent>

          <TabsContent value="simples">
            <SimplesNacionalIntegration />
          </TabsContent>
        </Tabs>

        <BookDetailsModal
          book={selectedBook || books[0]}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleBookSave}
          onDownload={handleBookDownload}
        />
      </div>
    </div>
  );
};

export default Dashboard;
