import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import BareButton from '@/Components/common/buttons/BareButton';
import Tooltip from '@/Components/common/Tooltip';

/**
 * Componente para exportar relatório detalhado de transações em formato Excel
 * com múltiplas abas: Resumo Executivo, Transações, Análise por Categoria e Análise por Banco
 */
export default function DetailedExportExcel({ data, name = "relatorio_financeiro" }) {

  // Estilos reutilizáveis
  const styles = {
    header: {
      fill: { patternType: "solid", fgColor: { rgb: "1f2b5e" } },
      font: { color: { rgb: "ffffff" }, bold: true, sz: 12 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    },
    subHeader: {
      fill: { patternType: "solid", fgColor: { rgb: "4472C4" } },
      font: { color: { rgb: "ffffff" }, bold: true, sz: 11 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    },
    title: {
      fill: { patternType: "solid", fgColor: { rgb: "305496" } },
      font: { color: { rgb: "ffffff" }, bold: true, sz: 14 },
      alignment: { horizontal: "center", vertical: "center" }
    },
    currency: {
      numFmt: "R$ #,##0.00",
      alignment: { horizontal: "right" }
    },
    percentage: {
      numFmt: "0.00%",
      alignment: { horizontal: "center" }
    },
    date: {
      numFmt: "dd/mm/yyyy",
      alignment: { horizontal: "center" }
    },
    center: {
      alignment: { horizontal: "center", vertical: "center" }
    },
    alternateRow: {
      fill: { patternType: "solid", fgColor: { rgb: "F2F2F2" } }
    },
    totalRow: {
      fill: { patternType: "solid", fgColor: { rgb: "FFF2CC" } },
      font: { bold: true },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };

  // Função auxiliar para aplicar estilo a uma célula
  const applyStyle = (worksheet, cellRef, style) => {
    if (!worksheet[cellRef]) return;
    worksheet[cellRef].s = {
      ...worksheet[cellRef].s,
      ...style
    };
  };

  // Função para calcular resumo executivo
  const calculateExecutiveSummary = (transactions) => {
    const summary = {
      total_transactions: transactions.length,
      total_income: 0,
      total_expenses: 0,
      total_credit: 0,
      total_debit: 0,
      pending_income: 0,
      pending_expenses: 0,
      paid_income: 0,
      paid_expenses: 0,
      recurring_count: 0,
      installments_count: 0,
      categories_count: new Set(),
      banks_count: new Set(),
      period_start: null,
      period_end: null,
    };

    transactions.forEach(t => {
      const amount = parseFloat(t.amount) || 0;
      const installmentAmount = parseFloat(t.installment_amount) || amount;

      // Totais por tipo
      if (t.type === 'credit') {
        summary.total_credit += installmentAmount;
        summary.total_expenses += installmentAmount;
        if (t.status === 'pending') summary.pending_expenses += installmentAmount;
        if (t.status === 'paid') summary.paid_expenses += installmentAmount;
      } else if (t.type === 'debit') {
        summary.total_debit += amount;
        summary.total_income += amount;
        if (t.status === 'pending') summary.pending_income += amount;
        if (t.status === 'paid') summary.paid_income += amount;
      }

      // Contadores
      if (t.is_recurring) summary.recurring_count++;
      if (t.total_installments && t.total_installments > 1) summary.installments_count++;
      
      if (t.category?.name) summary.categories_count.add(t.category.name);
      if (t.bank_user?.bank?.name) summary.banks_count.add(t.bank_user.bank.name);

      // Período
      if (t.created_at) {
        const date = new Date(t.created_at);
        if (!summary.period_start || date < summary.period_start) summary.period_start = date;
        if (!summary.period_end || date > summary.period_end) summary.period_end = date;
      }
    });

    return {
      ...summary,
      categories_count: summary.categories_count.size,
      banks_count: summary.banks_count.size,
      net_balance: summary.total_income - summary.total_expenses,
      average_income: summary.total_income / Math.max(summary.total_transactions, 1),
      average_expense: summary.total_expenses / Math.max(summary.total_transactions, 1),
    };
  };

  // Função para agrupar por categoria
  const groupByCategory = (transactions) => {
    const grouped = {};

    transactions.forEach(t => {
      const categoryName = t.category?.name || 'Sem categoria';
      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          category: categoryName,
          icon: t.category?.icon || '',
          total_amount: 0,
          total_credit: 0,
          total_debit: 0,
          count: 0,
          pending_count: 0,
          paid_count: 0,
          transactions: []
        };
      }

      const amount = parseFloat(t.amount) || 0;
      const installmentAmount = parseFloat(t.installment_amount) || amount;

      if (t.type === 'credit') {
        grouped[categoryName].total_credit += installmentAmount;
        grouped[categoryName].total_amount += installmentAmount;
      } else {
        grouped[categoryName].total_debit += amount;
        grouped[categoryName].total_amount += amount;
      }

      grouped[categoryName].count++;
      if (t.status === 'pending') grouped[categoryName].pending_count++;
      if (t.status === 'paid') grouped[categoryName].paid_count++;
      grouped[categoryName].transactions.push(t);
    });

    return Object.values(grouped).sort((a, b) => b.total_amount - a.total_amount);
  };

  // Função para agrupar por banco
  const groupByBank = (transactions) => {
    const grouped = {};

    transactions.forEach(t => {
      const bankName = t.bank_user?.bank?.name || 'Sem banco';
      if (!grouped[bankName]) {
        grouped[bankName] = {
          bank: bankName,
          total_amount: 0,
          total_credit: 0,
          total_debit: 0,
          count: 0,
          pending_count: 0,
          paid_count: 0,
          transactions: []
        };
      }

      const amount = parseFloat(t.amount) || 0;
      const installmentAmount = parseFloat(t.installment_amount) || amount;

      if (t.type === 'credit') {
        grouped[bankName].total_credit += installmentAmount;
        grouped[bankName].total_amount += installmentAmount;
      } else {
        grouped[bankName].total_debit += amount;
        grouped[bankName].total_amount += amount;
      }

      grouped[bankName].count++;
      if (t.status === 'pending') grouped[bankName].pending_count++;
      if (t.status === 'paid') grouped[bankName].paid_count++;
      grouped[bankName].transactions.push(t);
    });

    return Object.values(grouped).sort((a, b) => b.total_amount - a.total_amount);
  };

  // Função para agrupar por mês
  const groupByMonth = (transactions) => {
    const grouped = {};

    transactions.forEach(t => {
      const monthKey = t.invoice_month || t.year_month || 'Sem data';
      const monthLabel = t.invoice_month_label || t.month_label || 'Sem data';
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: monthLabel,
          total_amount: 0,
          total_credit: 0,
          total_debit: 0,
          count: 0,
          pending_amount: 0,
          paid_amount: 0,
        };
      }

      const amount = parseFloat(t.amount) || 0;
      const installmentAmount = parseFloat(t.installment_amount) || amount;

      if (t.type === 'credit') {
        grouped[monthKey].total_credit += installmentAmount;
        grouped[monthKey].total_amount += installmentAmount;
        if (t.status === 'pending') grouped[monthKey].pending_amount += installmentAmount;
        if (t.status === 'paid') grouped[monthKey].paid_amount += installmentAmount;
      } else {
        grouped[monthKey].total_debit += amount;
        grouped[monthKey].total_amount += amount;
        if (t.status === 'pending') grouped[monthKey].pending_amount += amount;
        if (t.status === 'paid') grouped[monthKey].paid_amount += amount;
      }

      grouped[monthKey].count++;
    });

    return Object.entries(grouped)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([, value]) => value);
  };

  // Criar aba de Resumo Executivo
  const createExecutiveSummarySheet = (summary, monthlyData) => {
    const data = [
      ['RELATÓRIO FINANCEIRO - RESUMO EXECUTIVO'],
      [],
      ['Período:', summary.period_start && summary.period_end 
        ? `${summary.period_start.toLocaleDateString('pt-BR')} a ${summary.period_end.toLocaleDateString('pt-BR')}`
        : 'N/A'
      ],
      ['Data de Geração:', new Date().toLocaleString('pt-BR')],
      [],
      ['VISÃO GERAL'],
      ['Total de Transações', summary.total_transactions],
      ['Total de Categorias', summary.categories_count],
      ['Total de Bancos', summary.banks_count],
      ['Transações Recorrentes', summary.recurring_count],
      ['Transações Parceladas', summary.installments_count],
      [],
      ['TOTALIZADORES FINANCEIROS'],
      ['Total de Receitas', summary.total_income],
      ['Total de Despesas', summary.total_expenses],
      ['Saldo Líquido', summary.net_balance],
      [],
      ['CRÉDITO (Despesas no Cartão)'],
      ['Total em Crédito', summary.total_credit],
      ['Crédito Pago', summary.paid_expenses],
      ['Crédito Pendente', summary.pending_expenses],
      [],
      ['DÉBITO (Receitas/Despesas à Vista)'],
      ['Total em Débito', summary.total_debit],
      ['Débito Pago', summary.paid_income],
      ['Débito Pendente', summary.pending_income],
      [],
      ['MÉDIAS'],
      ['Ticket Médio de Receita', summary.average_income],
      ['Ticket Médio de Despesa', summary.average_expense],
      [],
      ['RESUMO MENSAL'],
      ['Mês', 'Total', 'Crédito', 'Débito', 'Pago', 'Pendente', 'Qtd Transações']
    ];

    // Adicionar dados mensais
    monthlyData.forEach(month => {
      data.push([
        month.month,
        month.total_amount,
        month.total_credit,
        month.total_debit,
        month.paid_amount,
        month.pending_amount,
        month.count
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Larguras das colunas
    ws['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    // Aplicar estilos
    applyStyle(ws, 'A1', { ...styles.title, alignment: { horizontal: "center" } });
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    // Títulos de seções
    ['A6', 'A13', 'A17', 'A21', 'A25', 'A28'].forEach(cell => {
      applyStyle(ws, cell, styles.subHeader);
    });

    // Cabeçalho da tabela mensal
    ['A29', 'B29', 'C29', 'D29', 'E29', 'F29', 'G29'].forEach(cell => {
      applyStyle(ws, cell, styles.header);
    });

    // Formatar valores monetários
    const currencyRows = [14, 15, 16, 18, 19, 20, 22, 23, 24, 26, 27];
    currencyRows.forEach(row => {
      const cell = `B${row}`;
      if (ws[cell] && typeof ws[cell].v === 'number') {
        applyStyle(ws, cell, styles.currency);
      }
    });

    // Formatar tabela mensal
    const monthlyStartRow = 30;
    monthlyData.forEach((_, idx) => {
      const row = monthlyStartRow + idx;
      ['B', 'C', 'D', 'E', 'F'].forEach(col => {
        const cell = `${col}${row}`;
        if (ws[cell] && typeof ws[cell].v === 'number') {
          applyStyle(ws, cell, styles.currency);
        }
      });
      
      // Linhas alternadas
      if (idx % 2 === 1) {
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
          applyStyle(ws, `${col}${row}`, styles.alternateRow);
        });
      }
    });

    return ws;
  };

  // Criar aba de Transações Detalhadas
  const createTransactionsSheet = (transactions) => {
    const headers = [
      'ID',
      'Data',
      'Mês/Ano',
      'Tipo',
      'Status',
      'Título',
      'Descrição',
      'Valor Total',
      'Valor Parcela',
      'Parcela Atual',
      'Total Parcelas',
      'Recorrente',
      'Banco',
      'Categoria',
      'Mês Fatura'
    ];

    const data = [headers];

    transactions.forEach(t => {
      data.push([
        t.id || '',
        t.created_at_formatted || '',
        t.month_label || '',
        t.type === 'credit' ? 'Crédito' : t.type === 'debit' ? 'Débito' : t.type || '',
        t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : t.status || '',
        t.title || '',
        t.description || '',
        parseFloat(t.amount) || 0,
        parseFloat(t.installment_amount) || parseFloat(t.amount) || 0,
        t.current_installment || '',
        t.total_installments || '',
        t.is_recurring ? 'Sim' : 'Não',
        t.bank_user?.bank?.name || '',
        t.category?.name || '',
        t.invoice_month_label || t.month_label || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Larguras
    ws['!cols'] = [
      { wch: 8 },  // ID
      { wch: 16 }, // Data
      { wch: 15 }, // Mês/Ano
      { wch: 10 }, // Tipo
      { wch: 10 }, // Status
      { wch: 30 }, // Título
      { wch: 40 }, // Descrição
      { wch: 15 }, // Valor Total
      { wch: 15 }, // Valor Parcela
      { wch: 12 }, // Parcela Atual
      { wch: 12 }, // Total Parcelas
      { wch: 10 }, // Recorrente
      { wch: 20 }, // Banco
      { wch: 20 }, // Categoria
      { wch: 15 }  // Mês Fatura
    ];

    // Aplicar filtro automático
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: headers.length - 1 } }) };

    // Estilizar cabeçalho
    headers.forEach((_, idx) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: idx });
      applyStyle(ws, cell, styles.header);
    });

    // Estilizar dados
    transactions.forEach((t, rowIdx) => {
      const row = rowIdx + 1;
      
      // Valores monetários
      [7, 8].forEach(colIdx => {
        const cell = XLSX.utils.encode_cell({ r: row, c: colIdx });
        if (ws[cell]) applyStyle(ws, cell, styles.currency);
      });

      // Linhas alternadas
      if (rowIdx % 2 === 1) {
        headers.forEach((_, colIdx) => {
          const cell = XLSX.utils.encode_cell({ r: row, c: colIdx });
          applyStyle(ws, cell, styles.alternateRow);
        });
      }

      // Bordas
      headers.forEach((_, colIdx) => {
        const cell = XLSX.utils.encode_cell({ r: row, c: colIdx });
        applyStyle(ws, cell, { border: styles.border });
      });
    });

    return ws;
  };

  // Criar aba de Análise por Categoria
  const createCategoryAnalysisSheet = (categoryData, totalAmount) => {
    const headers = [
      'Categoria',
      'Total',
      'Crédito',
      'Débito',
      'Qtd',
      'Pago',
      'Pendente',
      '% do Total',
      'Ticket Médio'
    ];

    const data = [headers];

    categoryData.forEach(cat => {
      const percentage = totalAmount > 0 ? cat.total_amount / totalAmount : 0;
      const avgTicket = cat.count > 0 ? cat.total_amount / cat.count : 0;

      data.push([
        cat.category,
        cat.total_amount,
        cat.total_credit,
        cat.total_debit,
        cat.count,
        cat.paid_count,
        cat.pending_count,
        percentage,
        avgTicket
      ]);
    });

    // Linha de total
    const totalCredit = categoryData.reduce((sum, cat) => sum + cat.total_credit, 0);
    const totalDebit = categoryData.reduce((sum, cat) => sum + cat.total_debit, 0);
    const totalCount = categoryData.reduce((sum, cat) => sum + cat.count, 0);
    const totalPaid = categoryData.reduce((sum, cat) => sum + cat.paid_count, 0);
    const totalPending = categoryData.reduce((sum, cat) => sum + cat.pending_count, 0);

    data.push([
      'TOTAL',
      totalAmount,
      totalCredit,
      totalDebit,
      totalCount,
      totalPaid,
      totalPending,
      1,
      totalCount > 0 ? totalAmount / totalCount : 0
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Larguras
    ws['!cols'] = [
      { wch: 25 }, // Categoria
      { wch: 15 }, // Total
      { wch: 15 }, // Crédito
      { wch: 15 }, // Débito
      { wch: 10 }, // Qtd
      { wch: 10 }, // Pago
      { wch: 10 }, // Pendente
      { wch: 12 }, // % do Total
      { wch: 15 }  // Ticket Médio
    ];

    // Aplicar filtro
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 2, c: headers.length - 1 } }) };

    // Estilizar cabeçalho
    headers.forEach((_, idx) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: idx });
      applyStyle(ws, cell, styles.header);
    });

    // Estilizar dados
    categoryData.forEach((_, rowIdx) => {
      const row = rowIdx + 1;

      // Valores monetários
      [1, 2, 3, 8].forEach(colIdx => {
        const cell = XLSX.utils.encode_cell({ r: row, c: colIdx });
        if (ws[cell]) applyStyle(ws, cell, styles.currency);
      });

      // Percentual
      const percentCell = XLSX.utils.encode_cell({ r: row, c: 7 });
      if (ws[percentCell]) applyStyle(ws, percentCell, styles.percentage);

      // Linhas alternadas
      if (rowIdx % 2 === 1) {
        headers.forEach((_, colIdx) => {
          const cell = XLSX.utils.encode_cell({ r: row, c: colIdx });
          applyStyle(ws, cell, styles.alternateRow);
        });
      }

      // Bordas
      headers.forEach((_, colIdx) => {
        const cell = XLSX.utils.encode_cell({ r: row, c: colIdx });
        applyStyle(ws, cell, { border: styles.border });
      });
    });

    // Estilizar linha de total
    const totalRow = data.length - 1;
    headers.forEach((_, colIdx) => {
      const cell = XLSX.utils.encode_cell({ r: totalRow, c: colIdx });
      applyStyle(ws, cell, styles.totalRow);
      
      if ([1, 2, 3, 8].includes(colIdx)) {
        applyStyle(ws, cell, { ...styles.totalRow, ...styles.currency });
      }
      if (colIdx === 7) {
        applyStyle(ws, cell, { ...styles.totalRow, ...styles.percentage });
      }
    });

    return ws;
  };

  // Criar aba de Análise por Banco
  const createBankAnalysisSheet = (bankData, totalAmount) => {
    const headers = [
      'Banco',
      'Total',
      'Crédito',
      'Débito',
      'Qtd',
      'Pago',
      'Pendente',
      '% do Total',
      'Ticket Médio'
    ];

    const data = [headers];

    bankData.forEach(bank => {
      const percentage = totalAmount > 0 ? bank.total_amount / totalAmount : 0;
      const avgTicket = bank.count > 0 ? bank.total_amount / bank.count : 0;

      data.push([
        bank.bank,
        bank.total_amount,
        bank.total_credit,
        bank.total_debit,
        bank.count,
        bank.paid_count,
        bank.pending_count,
        percentage,
        avgTicket
      ]);
    });

    // Linha de total
    const totalCredit = bankData.reduce((sum, bank) => sum + bank.total_credit, 0);
    const totalDebit = bankData.reduce((sum, bank) => sum + bank.total_debit, 0);
    const totalCount = bankData.reduce((sum, bank) => sum + bank.count, 0);
    const totalPaid = bankData.reduce((sum, bank) => sum + bank.paid_count, 0);
    const totalPending = bankData.reduce((sum, bank) => sum + bank.pending_count, 0);

    data.push([
      'TOTAL',
      totalAmount,
      totalCredit,
      totalDebit,
      totalCount,
      totalPaid,
      totalPending,
      1,
      totalCount > 0 ? totalAmount / totalCount : 0
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Larguras
    ws['!cols'] = [
      { wch: 25 }, // Banco
      { wch: 15 }, // Total
      { wch: 15 }, // Crédito
      { wch: 15 }, // Débito
      { wch: 10 }, // Qtd
      { wch: 10 }, // Pago
      { wch: 10 }, // Pendente
      { wch: 12 }, // % do Total
      { wch: 15 }  // Ticket Médio
    ];

    // Aplicar filtro
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 2, c: headers.length - 1 } }) };

    // Estilizar cabeçalho
    headers.forEach((_, idx) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: idx });
      applyStyle(ws, cell, styles.header);
    });

    // Estilizar dados
    bankData.forEach((_, rowIdx) => {
      const row = rowIdx + 1;

      // Valores monetários
      [1, 2, 3, 8].forEach(colIdx => {
        const cell = XLSX.utils.encode_cell({ r: row, c: colIdx });
        if (ws[cell]) applyStyle(ws, cell, styles.currency);
      });

      // Percentual
      const percentCell = XLSX.utils.encode_cell({ r: row, c: 7 });
      if (ws[percentCell]) applyStyle(ws, percentCell, styles.percentage);

      // Linhas alternadas
      if (rowIdx % 2 === 1) {
        headers.forEach((_, colIdx) => {
          const cell = XLSX.utils.encode_cell({ r: row, c: colIdx });
          applyStyle(ws, cell, styles.alternateRow);
        });
      }

      // Bordas
      headers.forEach((_, colIdx) => {
        const cell = XLSX.utils.encode_cell({ r: row, c: colIdx });
        applyStyle(ws, cell, { border: styles.border });
      });
    });

    // Estilizar linha de total
    const totalRow = data.length - 1;
    headers.forEach((_, colIdx) => {
      const cell = XLSX.utils.encode_cell({ r: totalRow, c: colIdx });
      applyStyle(ws, cell, styles.totalRow);
      
      if ([1, 2, 3, 8].includes(colIdx)) {
        applyStyle(ws, cell, { ...styles.totalRow, ...styles.currency });
      }
      if (colIdx === 7) {
        applyStyle(ws, cell, { ...styles.totalRow, ...styles.percentage });
      }
    });

    return ws;
  };

  const exportDetailedReport = async () => {
    try {
      if (!data || data.length === 0) {
        alert('Não há dados para exportar.');
        return;
      }

      // Calcular análises
      const summary = calculateExecutiveSummary(data);
      const categoryData = groupByCategory(data);
      const bankData = groupByBank(data);
      const monthlyData = groupByMonth(data);

      // Criar workbook
      const workbook = XLSX.utils.book_new();

      // Adicionar abas
      const summarySheet = createExecutiveSummarySheet(summary, monthlyData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo Executivo');

      const transactionsSheet = createTransactionsSheet(data);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transações');

      const categorySheet = createCategoryAnalysisSheet(categoryData, summary.total_expenses);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Análise por Categoria');

      const bankSheet = createBankAnalysisSheet(bankData, summary.total_expenses);
      XLSX.utils.book_append_sheet(workbook, bankSheet, 'Análise por Banco');

      // Gerar arquivo
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        .replace(/\//g, '-').replace(/,/g, '').replace(/:/g, '-').replace(/\s/g, '_');
      saveAs(blob, `${name}_detalhado_${date}.xlsx`);

    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao gerar o arquivo Excel. Tente novamente.');
    }
  };

  return (
    <Tooltip label="Exportar relatório detalhado com análises (4 abas)">
      <BareButton className="btn-primary" onClick={exportDetailedReport}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
          <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V9H3V2a1 1 0 0 1 1-1h5.5zM3 12v-2h2v2zm0 1h2v2H4a1 1 0 0 1-1-1zm3 2v-2h3v2zm4 0v-2h3v1a1 1 0 0 1-1 1zm3-3h-3v-2h3zm-7 0v-2h3v2z"/>
        </svg>
      </BareButton>
    </Tooltip>
  );
}
