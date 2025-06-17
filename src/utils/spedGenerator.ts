
export interface SPEDConfig {
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual?: string;
  municipio: string;
  uf: string;
  periodo: {
    inicio: string;
    fim: string;
  };
}

export interface SPEDBook {
  type: 'ECD' | 'ECF' | 'EFD_CONTRIBUICOES';
  data: any[];
  config: SPEDConfig;
}

export const generateSPEDFile = (book: SPEDBook): string => {
  const { type, data, config } = book;
  
  switch (type) {
    case 'ECD':
      return generateECD(data, config);
    case 'ECF':
      return generateECF(data, config);
    case 'EFD_CONTRIBUICOES':
      return generateEFDContribuicoes(data, config);
    default:
      throw new Error('Tipo de arquivo SPED não suportado');
  }
};

const generateECD = (data: any[], config: SPEDConfig): string => {
  let content = '';
  
  // Registro 0000 - Abertura do arquivo digital
  content += `|0000|014|0|${formatDate(new Date())}|${formatDate(new Date())}|${config.razaoSocial}|${config.cnpj}|${config.uf}|${config.inscricaoEstadual || ''}|${config.municipio}|G||\n`;
  
  // Registro 0001 - Abertura do bloco 0
  content += `|0001|0|\n`;
  
  // Registro 0007 - Outras inscrições cadastrais
  content += `|0007|${config.cnpj}|${config.inscricaoEstadual || ''}|${config.razaoSocial}|${config.municipio}|${config.uf}|\n`;
  
  // Registro 0020 - Período da escrituração
  content += `|0020|${config.periodo.inicio.replace(/-/g, '')}|${config.periodo.fim.replace(/-/g, '')}|3|1|N|1,00||\n`;
  
  // Registros dos lançamentos contábeis
  data.forEach((lancamento, index) => {
    // Registro I050 - Plano de contas
    content += `|I050|${lancamento.conta || '1.1.01.01'}|${lancamento.descricao || 'Conta Genérica'}|${lancamento.nivel || '4'}|\n`;
    
    // Registro I150 - Saldos periódicos
    content += `|I150|${lancamento.conta || '1.1.01.01'}|${formatValue(lancamento.saldo || 0)}|D|\n`;
    
    // Registro I155 - Lançamentos contábeis
    if (lancamento.data && lancamento.valor) {
      content += `|I155|${lancamento.data.replace(/-/g, '')}|${index + 1}|${lancamento.conta || '1.1.01.01'}|${formatValue(lancamento.valor)}|${lancamento.tipo === 'credito' ? 'C' : 'D'}|${lancamento.historico || 'Lançamento contábil'}|\n`;
    }
  });
  
  // Registro 9999 - Encerramento do arquivo
  const totalLinhas = content.split('\n').length;
  content += `|9999|${totalLinhas}|\n`;
  
  return content;
};

const generateECF = (data: any[], config: SPEDConfig): string => {
  let content = '';
  
  // Registro 0000 - Abertura do arquivo
  content += `|0000|0406|0|${formatDate(new Date())}|${formatDate(new Date())}|${config.razaoSocial}|${config.cnpj}|1||\n`;
  
  // Registro 0010 - Dados da empresa
  content += `|0010|${config.cnpj}|${config.razaoSocial}|${config.municipio}|${config.uf}|\n`;
  
  // Registro 0030 - Dados do período e forma de tributação
  content += `|0030|${config.periodo.inicio.replace(/-/g, '')}|${config.periodo.fim.replace(/-/g, '')}|1|1|0|\n`;
  
  // Registros de apuração do lucro
  data.forEach((item) => {
    if (item.tipo === 'receita') {
      // Registro X290 - Receitas
      content += `|X290|${formatValue(item.valor)}|${item.descricao || 'Receita'}|\n`;
    } else if (item.tipo === 'despesa') {
      // Registro X291 - Custos e despesas
      content += `|X291|${formatValue(item.valor)}|${item.descricao || 'Despesa'}|\n`;
    }
  });
  
  // Registro 9999 - Encerramento
  const totalLinhas = content.split('\n').length;
  content += `|9999|${totalLinhas}|\n`;
  
  return content;
};

const generateEFDContribuicoes = (data: any[], config: SPEDConfig): string => {
  let content = '';
  
  // Registro 0000 - Abertura
  content += `|0000|018|1|${formatDate(new Date())}|${formatDate(new Date())}|${config.razaoSocial}|${config.cnpj}|${config.uf}|${config.inscricaoEstadual || ''}|A||\n`;
  
  // Registro 0001 - Abertura do bloco 0
  content += `|0001|0|\n`;
  
  // Registro 0010 - Identificação da empresa
  content += `|0010|${config.cnpj}|${config.razaoSocial}|${config.municipio}|${config.uf}||\n`;
  
  // Registro 0110 - Período de apuração
  content += `|0110|1|${config.periodo.inicio.replace(/-/g, '')}|${config.periodo.fim.replace(/-/g, '')}|\n`;
  
  // Registros de contribuições
  data.forEach((contrib) => {
    if (contrib.tipo === 'pis_cofins') {
      // Registro A100 - Documentos fiscais
      content += `|A100|0|1|${contrib.data?.replace(/-/g, '') || ''}|${contrib.numero || '1'}|||||${formatValue(contrib.baseCalculo || 0)}|${formatValue(contrib.valorPIS || 0)}|${formatValue(contrib.valorCOFINS || 0)}|\n`;
    }
  });
  
  // Registro 9999 - Encerramento
  const totalLinhas = content.split('\n').length;
  content += `|9999|${totalLinhas}|\n`;
  
  return content;
};

const formatDate = (date: Date): string => {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
};

const formatValue = (value: number): string => {
  return value.toFixed(2).replace('.', ',');
};

export const validateSPEDFile = (content: string, type: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  // Validações básicas
  if (!lines[0].startsWith('|0000|')) {
    errors.push('Arquivo deve iniciar com registro 0000');
  }
  
  if (!lines[lines.length - 2].startsWith('|9999|')) {
    errors.push('Arquivo deve terminar com registro 9999');
  }
  
  // Validar estrutura por tipo
  switch (type) {
    case 'ECD':
      if (!content.includes('|0001|0|')) {
        errors.push('ECD deve conter registro 0001');
      }
      break;
    case 'ECF':
      if (!content.includes('|0010|')) {
        errors.push('ECF deve conter registro 0010');
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
