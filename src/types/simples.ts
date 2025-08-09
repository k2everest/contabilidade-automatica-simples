export type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface PGDASInput {
  competencia: string; // YYYY-MM
  anexo: AnexoSimples;
  receitaBrutaMes: number; // receita do período
  receitaBruta12m: number; // receita bruta acumulada 12 meses
}

export interface DASCalculoResultado {
  aliquotaNominal: number; // em %
  parcelaADeduzir: number; // em R$
  aliquotaEfetiva: number; // em %
  dasDevido: number; // em R$
}

export interface DEFISInput {
  anoCalendario: number;
  receitaBrutaAnual: number;
  lucroContabil: number;
  distribuicaoLucros: number;
  empregadosEm31DeDezembro: number;
}
