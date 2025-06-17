
export const generateBookFile = (book: any, format: string = 'pdf') => {
  // Gerar dados simulados para o livro
  const mockData = generateMockBookData(book);
  
  if (format === 'csv') {
    return generateCSV(mockData, book.name);
  } else if (format === 'excel') {
    return generateExcel(mockData, book.name);
  } else {
    return generatePDF(mockData, book.name);
  }
};

const generateMockBookData = (book: any) => {
  const data = [];
  const recordCount = book.recordCount || 100;
  
  for (let i = 1; i <= recordCount; i++) {
    if (book.name.includes('Caixa')) {
      data.push({
        data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        descricao: `Movimentação ${i}`,
        entrada: Math.random() > 0.5 ? (Math.random() * 1000 + 100).toFixed(2) : '',
        saida: Math.random() > 0.5 ? (Math.random() * 800 + 50).toFixed(2) : '',
        saldo: (Math.random() * 5000 + 1000).toFixed(2)
      });
    } else if (book.name.includes('Inventário')) {
      data.push({
        codigo: `PROD${String(i).padStart(4, '0')}`,
        produto: `Produto ${i}`,
        quantidade: Math.floor(Math.random() * 100) + 1,
        valor_unitario: (Math.random() * 50 + 5).toFixed(2),
        valor_total: (Math.random() * 500 + 50).toFixed(2)
      });
    } else if (book.name.includes('Compras')) {
      data.push({
        data: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        fornecedor: `Fornecedor ${i}`,
        nota_fiscal: `NF${String(i).padStart(6, '0')}`,
        valor: (Math.random() * 2000 + 100).toFixed(2),
        imposto: (Math.random() * 200 + 10).toFixed(2)
      });
    }
  }
  
  return data;
};

const generateCSV = (data: any[], fileName: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${fileName.replace(/\s+/g, '_')}.csv`);
};

const generateExcel = (data: any[], fileName: string) => {
  // Simular conteúdo Excel como CSV formatado
  const headers = Object.keys(data[0] || {});
  const content = [
    headers.join('\t'),
    ...data.map(row => headers.map(header => row[header] || '').join('\t'))
  ].join('\n');
  
  const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
  downloadBlob(blob, `${fileName.replace(/\s+/g, '_')}.xls`);
};

const generatePDF = (data: any[], fileName: string) => {
  // Gerar conteúdo PDF simples como texto
  const headers = Object.keys(data[0] || {});
  let content = `${fileName}\n\nRelatório gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
  
  content += headers.join(' | ') + '\n';
  content += '-'.repeat(headers.join(' | ').length) + '\n';
  
  data.forEach(row => {
    content += headers.map(header => row[header] || '').join(' | ') + '\n';
  });
  
  const blob = new Blob([content], { type: 'text/plain' });
  downloadBlob(blob, `${fileName.replace(/\s+/g, '_')}.txt`);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
