import type { DEFISInput } from '@/types/simples';

export function exportarDEFIS(defis: DEFISInput) {
  const linhas = [
    'DEFIS - Declaração de Informações Socioeconômicas e Fiscais',
    `Ano-calendário: ${defis.anoCalendario}`,
    `Receita bruta anual: R$ ${defis.receitaBrutaAnual.toFixed(2)}`,
    `Lucro contábil: R$ ${defis.lucroContabil.toFixed(2)}`,
    `Distribuição de lucros: R$ ${defis.distribuicaoLucros.toFixed(2)}`,
    `Empregados em 31/12: ${defis.empregadosEm31DeDezembro}`,
  ].join('\n');

  const blob = new Blob([linhas], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DEFIS_${defis.anoCalendario}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
