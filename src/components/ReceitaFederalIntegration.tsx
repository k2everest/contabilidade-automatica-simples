
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Shield, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  Upload,
  Download,
  AlertTriangle,
  Key
} from 'lucide-react';
import { useReceitaFederal, type CertificateInfo } from '../hooks/useReceitaFederal';
import { generateSPEDFile, validateSPEDFile, type SPEDConfig, type SPEDBook } from '../utils/spedGenerator';
import { toast } from '@/hooks/use-toast';
import type { Book } from '../types';

interface ReceitaFederalIntegrationProps {
  books: Book[];
  company: {
    cnpj: string;
    razaoSocial: string;
    municipio: string;
    uf: string;
  };
}

const ReceitaFederalIntegration: React.FC<ReceitaFederalIntegrationProps> = ({
  books,
  company
}) => {
  const [certificateForm, setCertificateForm] = useState<Partial<CertificateInfo>>({
    type: 'A1'
  });
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [spedConfig, setSPEDConfig] = useState<Partial<SPEDConfig>>({
    cnpj: company.cnpj,
    razaoSocial: company.razaoSocial,
    municipio: company.municipio,
    uf: company.uf,
    periodo: {
      inicio: new Date().toISOString().slice(0, 7) + '-01',
      fim: new Date().toISOString().slice(0, 7) + '-31'
    }
  });

  const {
    certificate,
    transmissionHistory,
    isTransmitting,
    validateCertificate,
    transmitToReceita
  } = useReceitaFederal();

  const handleCertificateUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCertificateForm(prev => ({ ...prev, file }));
    }
  };

  const handleValidateCertificate = async () => {
    if (!certificateForm.type) return;
    
    const certInfo: CertificateInfo = {
      type: certificateForm.type,
      file: certificateForm.file,
      password: certificateForm.password,
      serial: certificateForm.serial
    };
    
    await validateCertificate(certInfo);
  };

  const handleGenerateAndTransmit = async () => {
    if (selectedBooks.length === 0) {
      toast({
        title: "Seleção Necessária",
        description: "Selecione pelo menos um livro para transmitir",
        variant: "destructive"
      });
      return;
    }

    if (!spedConfig.periodo?.inicio || !spedConfig.periodo?.fim) {
      toast({
        title: "Período Necessário",
        description: "Defina o período de apuração",
        variant: "destructive"
      });
      return;
    }

    for (const bookName of selectedBooks) {
      const book = books.find(b => b.name === bookName);
      if (!book) continue;

      try {
        // Determinar tipo SPED baseado no livro
        let spedType: 'ECD' | 'ECF' | 'EFD_CONTRIBUICOES';
        if (bookName.includes('Caixa') || bookName.includes('Inventário')) {
          spedType = 'ECD'; // Escrituração Contábil Digital
        } else if (bookName.includes('Lucro')) {
          spedType = 'ECF'; // Escrituração Contábil Fiscal
        } else {
          spedType = 'EFD_CONTRIBUICOES'; // EFD-Contribuições
        }

        // Gerar dados simulados para o SPED
        const mockData = generateMockSPEDData(bookName, spedType);
        
        const spedBook: SPEDBook = {
          type: spedType,
          data: mockData,
          config: spedConfig as SPEDConfig
        };

        // Gerar arquivo SPED
        const spedContent = generateSPEDFile(spedBook);
        
        // Validar arquivo
        const validation = validateSPEDFile(spedContent, spedType);
        if (!validation.valid) {
          toast({
            title: "Arquivo Inválido",
            description: `Erro no ${bookName}: ${validation.errors.join(', ')}`,
            variant: "destructive"
          });
          continue;
        }

        // Transmitir para Receita Federal
        const protocolo = await transmitToReceita(spedContent, spedType, company);
        
        if (protocolo) {
          // Download do arquivo SPED gerado
          const blob = new Blob([spedContent], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${spedType}_${company.cnpj}_${spedConfig.periodo?.inicio?.replace(/-/g, '')}.txt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }

      } catch (error) {
        toast({
          title: "Erro na Geração",
          description: `Erro ao processar ${bookName}`,
          variant: "destructive"
        });
      }
    }
  };

  const generateMockSPEDData = (bookName: string, type: 'ECD' | 'ECF' | 'EFD_CONTRIBUICOES') => {
    if (type === 'ECD') {
      return Array.from({ length: 20 }, (_, i) => ({
        data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        conta: `1.1.01.${String(i + 1).padStart(2, '0')}`,
        descricao: `Conta ${i + 1}`,
        valor: Math.random() * 10000 + 100,
        tipo: Math.random() > 0.5 ? 'debito' : 'credito',
        historico: `Lançamento contábil ${i + 1}`,
        saldo: Math.random() * 50000 + 1000
      }));
    } else if (type === 'ECF') {
      return Array.from({ length: 15 }, (_, i) => ({
        tipo: Math.random() > 0.6 ? 'receita' : 'despesa',
        valor: Math.random() * 20000 + 500,
        descricao: Math.random() > 0.6 ? 'Receita de vendas' : 'Despesa operacional',
        data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      }));
    } else {
      return Array.from({ length: 10 }, (_, i) => ({
        tipo: 'pis_cofins',
        data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        numero: `NF${String(i + 1).padStart(6, '0')}`,
        baseCalculo: Math.random() * 10000 + 1000,
        valorPIS: Math.random() * 165 + 10,
        valorCOFINS: Math.random() * 760 + 40
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const completedBooks = books.filter(book => book.status === 'completed');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Integração com a Receita Federal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="certificate" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="certificate">Certificado Digital</TabsTrigger>
              <TabsTrigger value="transmission">Transmissão SPED</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="certificate" className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Para transmitir arquivos à Receita Federal, é necessário um certificado digital válido (A1 ou A3).
                </AlertDescription>
              </Alert>

              {certificate ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Certificado Instalado</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>Tipo: {certificate.type}</p>
                    <p>Emissor: {certificate.issuer}</p>
                    <p>Válido até: {certificate.validUntil}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cert-type">Tipo de Certificado</Label>
                    <Select 
                      value={certificateForm.type} 
                      onValueChange={(value: 'A1' | 'A3') => 
                        setCertificateForm(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1 (Arquivo .p12/.pfx)</SelectItem>
                        <SelectItem value="A3">A3 (Token/Smartcard)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {certificateForm.type === 'A1' && (
                    <>
                      <div>
                        <Label htmlFor="cert-file">Arquivo do Certificado</Label>
                        <Input
                          id="cert-file"
                          type="file"
                          accept=".p12,.pfx"
                          onChange={handleCertificateUpload}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cert-password">Senha do Certificado</Label>
                        <Input
                          id="cert-password"
                          type="password"
                          value={certificateForm.password || ''}
                          onChange={(e) => setCertificateForm(prev => ({ 
                            ...prev, 
                            password: e.target.value 
                          }))}
                        />
                      </div>
                    </>
                  )}

                  {certificateForm.type === 'A3' && (
                    <div>
                      <Label htmlFor="cert-serial">Número de Série</Label>
                      <Input
                        id="cert-serial"
                        value={certificateForm.serial || ''}
                        onChange={(e) => setCertificateForm(prev => ({ 
                          ...prev, 
                          serial: e.target.value 
                        }))}
                        placeholder="Ex: 1234567890ABCDEF"
                      />
                    </div>
                  )}

                  <Button onClick={handleValidateCertificate} className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Validar Certificado
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="transmission" className="space-y-4">
              {!certificate && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Instale um certificado digital válido na aba "Certificado Digital" antes de transmitir.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="periodo-inicio">Período Inicial</Label>
                  <Input
                    id="periodo-inicio"
                    type="date"
                    value={spedConfig.periodo?.inicio || ''}
                    onChange={(e) => setSPEDConfig(prev => ({
                      ...prev,
                      periodo: { ...prev.periodo!, inicio: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="periodo-fim">Período Final</Label>
                  <Input
                    id="periodo-fim"
                    type="date"
                    value={spedConfig.periodo?.fim || ''}
                    onChange={(e) => setSPEDConfig(prev => ({
                      ...prev,
                      periodo: { ...prev.periodo!, fim: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Livros para Transmissão
                </Label>
                <div className="space-y-2">
                  {completedBooks.map(book => (
                    <div key={book.name} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        id={book.name}
                        checked={selectedBooks.includes(book.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBooks(prev => [...prev, book.name]);
                          } else {
                            setSelectedBooks(prev => prev.filter(name => name !== book.name));
                          }
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <Label htmlFor={book.name} className="font-medium">
                          {book.name}
                        </Label>
                        <p className="text-sm text-gray-600">{book.description}</p>
                      </div>
                      <Badge variant="secondary">
                        {book.name.includes('Caixa') || book.name.includes('Inventário') ? 'ECD' :
                         book.name.includes('Lucro') ? 'ECF' : 'EFD-Contrib'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {isTransmitting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Transmitindo para a Receita Federal...</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
              )}

              <Button
                onClick={handleGenerateAndTransmit}
                disabled={!certificate || selectedBooks.length === 0 || isTransmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Send className="h-4 w-4 mr-2" />
                {isTransmitting ? 'Transmitindo...' : 'Gerar e Transmitir SPED'}
              </Button>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {transmissionHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma transmissão realizada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transmissionHistory.map((transmission, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(transmission.status)}
                          <span className="font-medium">
                            {transmission.protocolo ? `Protocolo: ${transmission.protocolo}` : 'Transmissão'}
                          </span>
                        </div>
                        <Badge variant={
                          transmission.status === 'accepted' ? 'default' :
                          transmission.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {transmission.status === 'accepted' ? 'Aceito' :
                           transmission.status === 'rejected' ? 'Rejeitado' :
                           transmission.status === 'processing' ? 'Processando' : 'Erro'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{transmission.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(transmission.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceitaFederalIntegration;
