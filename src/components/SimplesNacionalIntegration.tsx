import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, Calculator, FileText, History } from 'lucide-react';
import type { PGDASInput, DEFISInput, DASCalculoResultado, AnexoSimples } from '@/types/simples';
import { calcularDAS, exportarResumoPGDAS } from '@/utils/pgdasGenerator';
import { exportarDEFIS } from '@/utils/defisGenerator';
import { generateBookFile } from '@/utils/fileGenerator';

const anexos: AnexoSimples[] = ['I', 'II', 'III', 'IV', 'V'];

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const SimplesNacionalIntegration: React.FC = () => {
  // PGDAS-D state
  const [pgdas, setPgdas] = useState<PGDASInput>({
    competencia: new Date().toISOString().slice(0, 7),
    anexo: 'I',
    receitaBrutaMes: 0,
    receitaBruta12m: 0,
  });
  const resultado: DASCalculoResultado | null = useMemo(() => {
    if (pgdas.receitaBrutaMes > 0 && pgdas.receitaBruta12m > 0) {
      return calcularDAS(pgdas);
    }
    return null;
  }, [pgdas]);

  // DEFIS state
  const [defis, setDefis] = useState<DEFISInput>({
    anoCalendario: new Date().getFullYear() - 1,
    receitaBrutaAnual: 0,
    lucroContabil: 0,
    distribuicaoLucros: 0,
    empregadosEm31DeDezembro: 0,
  });

  // Histórico simples
  const [historico, setHistorico] = useState<Array<{ tipo: 'PGDAS' | 'DEFIS'; referencia: string; valor: number }>>([]);

  return (
    <section aria-labelledby="simples-title" className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 id="simples-title" className="text-xl font-semibold">Simples Nacional</h2>
        <Badge variant="outline">Regime: Simples Nacional</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Obrigações</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pgdas" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pgdas">PGDAS-D</TabsTrigger>
              <TabsTrigger value="defis">DEFIS</TabsTrigger>
              <TabsTrigger value="livros">Livros</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="pgdas" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Competência</Label>
                  <Input type="month" value={pgdas.competencia} onChange={(e) => setPgdas({ ...pgdas, competencia: e.target.value })} />
                </div>
                <div>
                  <Label>Anexo</Label>
                  <Select value={pgdas.anexo} onValueChange={(v) => setPgdas({ ...pgdas, anexo: v as AnexoSimples })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o anexo" />
                    </SelectTrigger>
                    <SelectContent>
                      {anexos.map(a => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Receita do mês (R$)</Label>
                  <Input type="number" min={0} value={pgdas.receitaBrutaMes}
                         onChange={(e) => setPgdas({ ...pgdas, receitaBrutaMes: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>RBT12 (R$)</Label>
                  <Input type="number" min={0} value={pgdas.receitaBruta12m}
                         onChange={(e) => setPgdas({ ...pgdas, receitaBruta12m: Number(e.target.value) })} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={() => {
                  if (!resultado) {
                    toast({ title: 'Informe os valores de receita', description: 'Preencha receita do mês e RBT12.' });
                    return;
                  }
                  setHistorico(prev => [{ tipo: 'PGDAS', referencia: pgdas.competencia, valor: resultado.dasDevido }, ...prev]);
                  toast({ title: 'DAS calculado', description: `Valor devido: ${currency(resultado.dasDevido)}` });
                }}>
                  <Calculator className="mr-2 h-4 w-4" /> Calcular DAS
                </Button>

                <Button variant="outline" onClick={() => {
                  if (!resultado) return;
                  exportarResumoPGDAS(pgdas, resultado);
                }}>
                  <FileText className="mr-2 h-4 w-4" /> Gerar resumo PGDAS-D
                </Button>
              </div>

              {resultado && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Alíquota nominal</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">{resultado.aliquotaNominal}%</CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Parcela a deduzir</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">{currency(resultado.parcelaADeduzir)}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Alíquota efetiva</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">{resultado.aliquotaEfetiva}%</CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">DAS devido</CardTitle></CardHeader>
                    <CardContent className="text-2xl font-bold">{currency(resultado.dasDevido)}</CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="defis" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>Ano-calendário</Label>
                  <Input type="number" value={defis.anoCalendario} onChange={(e) => setDefis({ ...defis, anoCalendario: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Receita bruta anual (R$)</Label>
                  <Input type="number" min={0} value={defis.receitaBrutaAnual} onChange={(e) => setDefis({ ...defis, receitaBrutaAnual: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Lucro contábil (R$)</Label>
                  <Input type="number" min={0} value={defis.lucroContabil} onChange={(e) => setDefis({ ...defis, lucroContabil: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Distribuição de lucros (R$)</Label>
                  <Input type="number" min={0} value={defis.distribuicaoLucros} onChange={(e) => setDefis({ ...defis, distribuicaoLucros: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Empregados em 31/12</Label>
                  <Input type="number" min={0} value={defis.empregadosEm31DeDezembro} onChange={(e) => setDefis({ ...defis, empregadosEm31DeDezembro: Number(e.target.value) })} />
                </div>
              </div>

              <Button onClick={() => {
                exportarDEFIS(defis);
                setHistorico(prev => [{ tipo: 'DEFIS', referencia: String(defis.anoCalendario), valor: defis.receitaBrutaAnual }, ...prev]);
                toast({ title: 'DEFIS gerada', description: 'Arquivo de resumo DEFIS baixado.' });
              }}>
                <FileText className="mr-2 h-4 w-4" /> Gerar DEFIS (resumo)
              </Button>
            </TabsContent>

            <TabsContent value="livros" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>Livro Caixa</CardTitle></CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={() => generateBookFile({ name: 'Livro Caixa', recordCount: 150 }, 'pdf')}>
                      <FileText className="mr-2 h-4 w-4" /> Gerar Livro Caixa
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Registro de Vendas</CardTitle></CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={() => generateBookFile({ name: 'Registro de Vendas', recordCount: 200 }, 'csv')}>
                      <FileText className="mr-2 h-4 w-4" /> Gerar Registro de Vendas
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="historico">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium"><History className="h-4 w-4" /> Últimos eventos</div>
                {historico.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {historico.map((h, idx) => (
                      <li key={idx} className="text-sm flex items-center justify-between">
                        <span>
                          {h.tipo} - {h.referencia}
                        </span>
                        <span className="font-semibold">{currency(h.valor)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <aside className="text-xs text-muted-foreground">
        Observação: Cálculos e arquivos gerados são simplificados para fins de demonstração.
      </aside>
    </section>
  );
};

export default SimplesNacionalIntegration;
