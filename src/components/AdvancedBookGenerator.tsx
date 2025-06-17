
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Calendar, 
  Filter, 
  Download, 
  Zap,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Book } from '../types';

interface AdvancedBookGeneratorProps {
  availableERPs: string[];
  integrationData: any;
  onGenerateBooks: (config: BookGenerationConfig) => void;
  isGenerating: boolean;
  generationProgress: number;
}

interface BookGenerationConfig {
  erps: string[];
  period: {
    start: string;
    end: string;
  };
  bookTypes: string[];
  format: string;
  includeAnalytics: boolean;
  autoValidation: boolean;
  digitalSignature: boolean;
}

const AdvancedBookGenerator: React.FC<AdvancedBookGeneratorProps> = ({
  availableERPs,
  integrationData,
  onGenerateBooks,
  isGenerating,
  generationProgress
}) => {
  const [config, setConfig] = useState<BookGenerationConfig>({
    erps: [],
    period: {
      start: new Date().toISOString().slice(0, 7),
      end: new Date().toISOString().slice(0, 7)
    },
    bookTypes: ['caixa'], // Pré-selecionar o livro caixa
    format: 'pdf',
    includeAnalytics: false,
    autoValidation: true,
    digitalSignature: false
  });

  const allERPs = ['bling', 'tiny', 'omie', 'granatum', 'conta_azul', 'sage'];

  const bookTypes = [
    { id: 'caixa', name: 'Livro Caixa', required: true, icon: '💰' },
    { id: 'inventario', name: 'Registro de Inventário', required: true, icon: '📦' },
    { id: 'compras', name: 'Registro de Compras', required: true, icon: '🛒' },
    { id: 'vendas', name: 'Registro de Vendas', required: false, icon: '📊' },
    { id: 'lucro_real', name: 'Apuração do Lucro Real', required: false, icon: '💹' },
    { id: 'prestacao_servicos', name: 'Prestação de Serviços', required: false, icon: '🔧' }
  ];

  const formats = [
    { value: 'pdf', label: 'PDF Padrão', icon: '📄' },
    { value: 'excel', label: 'Excel Detalhado', icon: '📊' },
    { value: 'xml', label: 'XML SPED', icon: '🔗' },
    { value: 'csv', label: 'CSV Dados', icon: '📋' }
  ];

  const handleERPChange = (erpId: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      erps: checked 
        ? [...prev.erps, erpId]
        : prev.erps.filter(id => id !== erpId)
    }));
  };

  const handleBookTypeChange = (bookTypeId: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      bookTypes: checked 
        ? [...prev.bookTypes, bookTypeId]
        : prev.bookTypes.filter(id => id !== bookTypeId)
    }));
  };

  const handleGenerate = () => {
    if (config.bookTypes.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um tipo de livro",
        variant: "destructive"
      });
      return;
    }

    // Se não há ERPs selecionados, usar dados simulados
    if (config.erps.length === 0) {
      toast({
        title: "Gerando com dados simulados",
        description: "Nenhum ERP selecionado. Usando dados de exemplo para demonstração.",
      });
    }

    onGenerateBooks(config);
  };

  const getDataAvailability = () => {
    let totalRecords = 0;
    config.erps.forEach(erpId => {
      const data = integrationData[erpId];
      if (data) {
        totalRecords += (data.sales?.length || 0) + 
                       (data.purchases?.length || 0) + 
                       (data.financial?.length || 0);
      }
    });
    return totalRecords;
  };

  const canGenerate = config.bookTypes.length > 0 && !isGenerating;
  const hasConnectedERPs = availableERPs.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Gerador Inteligente de Livros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alerta informativo */}
          {!hasConnectedERPs && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Nenhum ERP conectado. Você pode gerar livros com dados de exemplo ou conectar um ERP na aba "Integrações" para usar dados reais.
              </AlertDescription>
            </Alert>
          )}

          {/* Seleção de ERPs */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Fontes de Dados (ERPs) - Opcional
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allERPs.map(erpId => {
                const hasData = integrationData[erpId];
                const isConnected = availableERPs.includes(erpId);
                return (
                  <div key={erpId} className={`flex items-center space-x-3 p-3 border rounded-lg ${
                    hasData ? 'border-green-200 bg-green-50' : 
                    isConnected ? 'border-blue-200 bg-blue-50' : 
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <Checkbox
                      id={erpId}
                      checked={config.erps.includes(erpId)}
                      onCheckedChange={(checked) => handleERPChange(erpId, checked as boolean)}
                      disabled={!isConnected}
                    />
                    <Label htmlFor={erpId} className="flex-1">
                      {erpId.charAt(0).toUpperCase() + erpId.slice(1)}
                    </Label>
                    {hasData ? (
                      <span className="text-xs text-green-600 font-medium">
                        {(integrationData[erpId].sales?.length || 0) + 
                         (integrationData[erpId].purchases?.length || 0)} registros
                      </span>
                    ) : isConnected ? (
                      <span className="text-xs text-blue-600">Conectado</span>
                    ) : (
                      <span className="text-xs text-gray-400">Desconectado</span>
                    )}
                  </div>
                );
              })}
            </div>
            {config.erps.length === 0 && (
              <p className="text-sm text-gray-600 mt-2">
                💡 Sem ERPs selecionados? Não tem problema! Você pode gerar livros com dados de exemplo para testar o sistema.
              </p>
            )}
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-period">Período Inicial</Label>
              <Input
                id="start-period"
                type="month"
                value={config.period.start}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  period: { ...prev.period, start: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="end-period">Período Final</Label>
              <Input
                id="end-period"
                type="month"
                value={config.period.end}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  period: { ...prev.period, end: e.target.value }
                }))}
              />
            </div>
          </div>

          {/* Tipos de Livros */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Livros Contábeis
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bookTypes.map(book => (
                <div key={book.id} className={`flex items-center space-x-3 p-3 border rounded-lg ${
                  book.required ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}>
                  <Checkbox
                    id={book.id}
                    checked={config.bookTypes.includes(book.id)}
                    onCheckedChange={(checked) => handleBookTypeChange(book.id, checked as boolean)}
                  />
                  <span className="text-lg">{book.icon}</span>
                  <div className="flex-1">
                    <Label htmlFor={book.id} className="font-medium">
                      {book.name}
                    </Label>
                    {book.required && (
                      <span className="text-xs text-blue-600 block">Obrigatório para Simples Nacional</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formato e Opções */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="format">Formato de Saída</Label>
              <Select value={config.format} onValueChange={(value) => 
                setConfig(prev => ({ ...prev, format: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      <span className="flex items-center space-x-2">
                        <span>{format.icon}</span>
                        <span>{format.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="analytics"
                  checked={config.includeAnalytics}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, includeAnalytics: checked as boolean }))
                  }
                />
                <Label htmlFor="analytics" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Incluir Análises</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validation"
                  checked={config.autoValidation}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, autoValidation: checked as boolean }))
                  }
                />
                <Label htmlFor="validation" className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Validação Automática</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="signature"
                  checked={config.digitalSignature}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, digitalSignature: checked as boolean }))
                  }
                />
                <Label htmlFor="signature" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Assinatura Digital</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Informações de Dados */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Resumo da Geração
              </span>
            </div>
            {config.erps.length > 0 ? (
              <p className="text-sm text-blue-700">
                {getDataAvailability()} registros encontrados nos ERPs selecionados.
                Estimativa de {config.bookTypes.length} livros a serem gerados.
              </p>
            ) : (
              <p className="text-sm text-blue-700">
                Gerando {config.bookTypes.length} livros com dados de exemplo.
                Perfeito para testar o sistema antes de conectar seus ERPs!
              </p>
            )}
          </div>

          {/* Progresso de Geração */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gerando livros...</span>
                <span className="text-sm text-gray-500">{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
          )}

          {/* Botão de Geração */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full h-12 text-base ${
              canGenerate 
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                : ''
            }`}
          >
            <Download className="h-5 w-5 mr-2" />
            {isGenerating ? 'Gerando Livros...' : 'Gerar Livros Contábeis'}
          </Button>
          
          {!canGenerate && !isGenerating && (
            <p className="text-center text-sm text-gray-500">
              {config.bookTypes.length === 0 
                ? 'Selecione pelo menos um tipo de livro para continuar' 
                : 'Aguarde...'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedBookGenerator;
