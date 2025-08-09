import type { PGDASInput, DASCalculoResultado, AnexoSimples } from '@/types/simples';

// TABELAS SIMPLIFICADAS (exemplificativas) POR ANEXO: [faixa até R$, alíquota %, parcela a deduzir R$]
const TABELAS: Record<AnexoSimples, Array<[number, number, number]>> = {
  I: [
    [180000, 4.0, 0],
    [360000, 7.3, 5940],
    [720000, 9.5, 13860],
    [1800000, 10.7, 22500],
    [3600000, 14.3, 87300],
    [4800000, 19.0, 378000],
  ],
  II: [
    [180000, 4.5, 0],
    [360000, 7.8, 5940],
    [720000, 10.0, 13860],
    [1800000, 11.2, 22500],
    [3600000, 14.7, 85500],
    [4800000, 30.0, 720000],
  ],
  III: [
    [180000, 6.0, 0],
    [360000, 11.2, 9360],
    [720000, 13.5, 17640],
    [1800000, 16.0, 35640],
    [3600000, 21.0, 125640],
    [4800000, 33.0, 648000],
  ],
  IV: [
    [180000, 4.5, 0],
    [360000, 9.0, 8100],
    [720000, 10.2, 12420],
    [1800000, 14.0, 39780],
    [3600000, 22.0, 183780],
    [4800000, 33.0, 828000],
  ],
  V: [
    [180000, 15.5, 0],
    [360000, 18.0, 4500],
    [720000, 19.5, 9900],
    [1800000, 20.5, 17100],
    [3600000, 23.0, 62100],
    [4800000, 30.5, 540000],
  ],
};

export function calcularDAS(input: PGDASInput): DASCalculoResultado {
  const { receitaBruta12m, receitaBrutaMes, anexo } = input;
  const tabela = TABELAS[anexo];

  // Encontrar faixa
  const faixa = tabela.find(([limite]) => receitaBruta12m <= limite) || tabela[tabela.length - 1];
  const [, aliquotaNominal, parcelaADeduzir] = faixa;

  // Fórmula oficial (simplificada):
  // Aliquota efetiva = ((RBT12 * AliqNominal) - PD) / RBT12
  const aliquotaEfetiva = Math.max(0, ((receitaBruta12m * (aliquotaNominal / 100)) - parcelaADeduzir) / receitaBruta12m) * 100;
  const dasDevido = +(receitaBrutaMes * (aliquotaEfetiva / 100)).toFixed(2);

  return {
    aliquotaNominal,
    parcelaADeduzir,
    aliquotaEfetiva: +aliquotaEfetiva.toFixed(4),
    dasDevido,
  };
}

export function exportarResumoPGDAS(input: PGDASInput, resultado: DASCalculoResultado) {
  const linhas = [
    'PGDAS-D - Resumo do Cálculo',
    `Competência: ${input.competencia}`,
    `Anexo: ${input.anexo}`,
    `Receita do mês: R$ ${input.receitaBrutaMes.toFixed(2)}`,
    `RBT12: R$ ${input.receitaBruta12m.toFixed(2)}`,
    `Alíquota nominal: ${resultado.aliquotaNominal}%`,
    `Parcela a deduzir: R$ ${resultado.parcelaADeduzir.toFixed(2)}`,
    `Alíquota efetiva: ${resultado.aliquotaEfetiva}%`,
    `DAS devido: R$ ${resultado.dasDevido.toFixed(2)}`,
  ].join('\n');

  const blob = new Blob([linhas], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PGDAS_${input.competencia.replace('-', '')}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
