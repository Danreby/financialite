import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import BareButton from '@/Components/common/buttons/BareButton';
import Tooltip from '@/Components/common/Tooltip';


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
      cards_count: new Set(),
      period_start: null,
      period_end: null,
      recurring_amount: 0,
      non_recurring_amount: 0,
      overdue_count: 0,
      overdue_amount: 0,
    };

    const today = new Date();

    transactions.forEach(t => {
      const amount = parseFloat(t.amount) || 0;
      const installmentAmount = parseFloat(t.installment_amount) || amount;

      // Totais por tipo
      if (t.type === 'credit') {
        summary.total_credit += installmentAmount;
        summary.total_expenses += installmentAmount;
        if (t.status === 'pending') summary.pending_expenses += installmentAmount;
        if (t.status === 'paid') summary.paid_expenses += installmentAmount;
        
        // Identificar recorrentes vs não recorrentes
        if (t.is_recurring) {
          summary.recurring_amount += installmentAmount;
        } else {
          summary.non_recurring_amount += installmentAmount;
        }
      } else if (t.type === 'debit') {
        summary.total_debit += amount;
        summary.total_income += amount;
        if (t.status === 'pending') summary.pending_income += amount;
        if (t.status === 'paid') summary.paid_income += amount;
      }

      // Verificar vencidos
      if (t.status === 'pending' && t.due_date) {
        const dueDate = new Date(t.due_date);
        if (dueDate < today) {
          summary.overdue_count++;
          summary.overdue_amount += (t.type === 'credit' ? installmentAmount : amount);
        }
      }

      // Contadores
      if (t.is_recurring) summary.recurring_count++;
      if (t.total_installments && t.total_installments > 1) summary.installments_count++;
      
      if (t.category?.name) summary.categories_count.add(t.category.name);
      if (t.bank_user?.bank?.name) summary.cards_count.add(t.bank_user.bank.name);

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
      cards_count: summary.cards_count.size,
      net_balance: summary.total_income - summary.total_expenses,
      average_income: summary.total_income / Math.max(summary.total_transactions, 1),
      average_expense: summary.total_expenses / Math.max(summary.total_transactions, 1),
      recurring_percentage: summary.total_expenses > 0 ? (summary.recurring_amount / summary.total_expenses) * 100 : 0,
      non_recurring_percentage: summary.total_expenses > 0 ? (summary.non_recurring_amount / summary.total_expenses) * 100 : 0,
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
      const bankName = t.bank_user?.bank?.name || 'Sem cartão';
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

  // Função para obter top transações
  const getTopTransactions = (transactions, limit = 10) => {
    return [...transactions]
      .map(t => ({
        ...t,
        display_amount: t.type === 'credit' ? (parseFloat(t.installment_amount) || parseFloat(t.amount) || 0) : (parseFloat(t.amount) || 0)
      }))
      .sort((a, b) => b.display_amount - a.display_amount)
      .slice(0, limit);
  };

  // Função para análise de recorrentes
  const analyzeRecurring = (transactions) => {
    const recurring = transactions.filter(t => t.is_recurring);
    const nonRecurring = transactions.filter(t => !t.is_recurring);

    const recurringTotal = recurring.reduce((sum, t) => {
      const amount = t.type === 'credit' ? (parseFloat(t.installment_amount) || parseFloat(t.amount) || 0) : (parseFloat(t.amount) || 0);
      return sum + amount;
    }, 0);

    const nonRecurringTotal = nonRecurring.reduce((sum, t) => {
      const amount = t.type === 'credit' ? (parseFloat(t.installment_amount) || parseFloat(t.amount) || 0) : (parseFloat(t.amount) || 0);
      return sum + amount;
    }, 0);

    return {
      recurring_count: recurring.length,
      recurring_total: recurringTotal,
      recurring_average: recurring.length > 0 ? recurringTotal / recurring.length : 0,
      non_recurring_count: nonRecurring.length,
      non_recurring_total: nonRecurringTotal,
      non_recurring_average: nonRecurring.length > 0 ? nonRecurringTotal / nonRecurring.length : 0,
      recurring_percentage: (recurringTotal + nonRecurringTotal) > 0 ? (recurringTotal / (recurringTotal + nonRecurringTotal)) * 100 : 0,
    };
  };

  // Função para análise de tendências
  const analyzeTrends = (monthlyData) => {
    if (monthlyData.length < 2) return null;

    const trends = [];
    for (let i = 1; i < monthlyData.length; i++) {
      const current = monthlyData[i];
      const previous = monthlyData[i - 1];
      
      const growthRate = previous.total_amount > 0 
        ? ((current.total_amount - previous.total_amount) / previous.total_amount) * 100 
        : 0;

      trends.push({
        month: current.month,
        amount: current.total_amount,
        previous_amount: previous.total_amount,
        growth_rate: growthRate,
        variation: current.total_amount - previous.total_amount,
      });
    }

    // Calcular média de crescimento
    const avgGrowth = trends.reduce((sum, t) => sum + t.growth_rate, 0) / trends.length;
    
    return {
      trends,
      average_growth: avgGrowth,
      highest_month: monthlyData.reduce((max, m) => m.total_amount > max.total_amount ? m : max, monthlyData[0]),
      lowest_month: monthlyData.reduce((min, m) => m.total_amount < min.total_amount ? m : min, monthlyData[0]),
    };
  };

  // Criar aba de Resumo Executivo
  const createExecutiveSummarySheet = (summary, monthlyData) => {
    const rows = [];
    const sectionHeaderRows = [];
    const tableHeaderRows = [];
    const currencyCells = [];
    const percentCells = [];
    let netBalanceRow = -1;
    let taxaPoupancaRow = -1;

    const pushRow = (row) => { rows.push(row); return rows.length - 1; };

    pushRow(['RELATÓRIO FINANCEIRO - RESUMO EXECUTIVO']);
    pushRow([]);
    pushRow(['Período:', summary.period_start && summary.period_end
      ? `${summary.period_start.toLocaleDateString('pt-BR')} a ${summary.period_end.toLocaleDateString('pt-BR')}`
      : 'N/A',
    ]);
    pushRow(['Data de Geração:', new Date().toLocaleString('pt-BR')]);
    pushRow([]);

    sectionHeaderRows.push(pushRow(['VISÃO GERAL']));
    pushRow(['Total de Transações', summary.total_transactions]);
    pushRow(['Total de Categorias', summary.categories_count]);
    pushRow(['Total de Cartões/Contas', summary.cards_count]);
    pushRow(['Transações Recorrentes', summary.recurring_count]);
    pushRow(['Transações Parceladas', summary.installments_count]);
    pushRow([]);

    sectionHeaderRows.push(pushRow(['TOTALIZADORES FINANCEIROS']));
    let r = pushRow(['Total de Receitas', summary.total_income]);
    currencyCells.push([r, 1]);
    r = pushRow(['Total de Despesas', summary.total_expenses]);
    currencyCells.push([r, 1]);
    netBalanceRow = pushRow(['Saldo Líquido', summary.net_balance]);
    currencyCells.push([netBalanceRow, 1]);
    const savingsRate = summary.total_income > 0 ? (summary.net_balance / summary.total_income) : 0;
    taxaPoupancaRow = pushRow(['Taxa de Poupança', savingsRate]);
    percentCells.push([taxaPoupancaRow, 1]);
    pushRow([]);

    sectionHeaderRows.push(pushRow(['CRÉDITO (Despesas no Cartão)']));
    r = pushRow(['Total em Crédito', summary.total_credit]);
    currencyCells.push([r, 1]);
    r = pushRow(['Crédito Pago', summary.paid_expenses]);
    currencyCells.push([r, 1]);
    r = pushRow(['Crédito Pendente', summary.pending_expenses]);
    currencyCells.push([r, 1]);
    pushRow([]);

    sectionHeaderRows.push(pushRow(['DÉBITO (Receitas/Débito à Vista)']));
    r = pushRow(['Total em Débito', summary.total_debit]);
    currencyCells.push([r, 1]);
    r = pushRow(['Débito Pago', summary.paid_income]);
    currencyCells.push([r, 1]);
    r = pushRow(['Débito Pendente', summary.pending_income]);
    currencyCells.push([r, 1]);
    pushRow([]);

    sectionHeaderRows.push(pushRow(['MÉDIAS']));
    r = pushRow(['Ticket Médio de Receita', summary.average_income]);
    currencyCells.push([r, 1]);
    r = pushRow(['Ticket Médio de Despesa', summary.average_expense]);
    currencyCells.push([r, 1]);
    pushRow([]);

    sectionHeaderRows.push(pushRow(['ANÁLISE DE RECORRÊNCIA']));
    r = pushRow(['Gastos Recorrentes', summary.recurring_amount]);
    currencyCells.push([r, 1]);
    r = pushRow(['Gastos Não Recorrentes', summary.non_recurring_amount]);
    currencyCells.push([r, 1]);
    r = pushRow(['% Recorrentes', summary.recurring_percentage / 100]);
    percentCells.push([r, 1]);
    r = pushRow(['% Não Recorrentes', summary.non_recurring_percentage / 100]);
    percentCells.push([r, 1]);
    pushRow([]);

    sectionHeaderRows.push(pushRow(['CONTAS VENCIDAS']));
    pushRow(['Quantidade Vencida', summary.overdue_count]);
    r = pushRow(['Valor Total Vencido', summary.overdue_amount]);
    currencyCells.push([r, 1]);
    pushRow([]);

    sectionHeaderRows.push(pushRow(['RESUMO MENSAL']));
    const monthHeaderIdx = pushRow(['Mês', 'Total', 'Crédito', 'Débito', 'Pago', 'Pendente', 'Qtd Transações']);
    tableHeaderRows.push(monthHeaderIdx);
    const monthlyStart = rows.length;
    monthlyData.forEach(month => {
      const mIdx = pushRow([
        month.month,
        month.total_amount,
        month.total_credit,
        month.total_debit,
        month.paid_amount,
        month.pending_amount,
        month.count,
      ]);
      [1, 2, 3, 4, 5].forEach(c => currencyCells.push([mIdx, c]));
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = [
      { wch: 32 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 },
    ];

    // Título com merge
    applyStyle(ws, XLSX.utils.encode_cell({ r: 0, c: 0 }), {
      ...styles.title, alignment: { horizontal: 'center', vertical: 'center' },
    });
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    // Cabeçalhos de seção
    sectionHeaderRows.forEach(rowIdx => {
      const cell = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
      if (ws[cell]) applyStyle(ws, cell, styles.subHeader);
    });

    // Cabeçalho da tabela mensal
    tableHeaderRows.forEach(rowIdx => {
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
        applyStyle(ws, `${col}${rowIdx + 1}`, styles.header);
      });
    });

    // Formatação de moeda
    currencyCells.forEach(([rowIdx, colIdx]) => {
      const cell = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      if (ws[cell] && typeof ws[cell].v === 'number') applyStyle(ws, cell, styles.currency);
    });

    // Formatação de porcentagem
    percentCells.forEach(([rowIdx, colIdx]) => {
      const cell = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      if (ws[cell]) applyStyle(ws, cell, styles.percentage);
    });

    // Colorir Saldo Líquido (verde se positivo, vermelho se negativo)
    const netCell = XLSX.utils.encode_cell({ r: netBalanceRow, c: 1 });
    if (ws[netCell]) {
      const netVal = summary.net_balance;
      applyStyle(ws, netCell, {
        numFmt: 'R$ #,##0.00',
        alignment: { horizontal: 'right' },
        font: { bold: true, color: { rgb: netVal >= 0 ? '276221' : '9C0006' } },
        fill: { patternType: 'solid', fgColor: { rgb: netVal >= 0 ? 'C6EFCE' : 'FFC7CE' } },
      });
    }

    // Colorir Taxa de Poupança
    const taxaCell = XLSX.utils.encode_cell({ r: taxaPoupancaRow, c: 1 });
    if (ws[taxaCell]) {
      applyStyle(ws, taxaCell, {
        numFmt: '0.00%',
        alignment: { horizontal: 'center' },
        font: { bold: true, color: { rgb: savingsRate >= 0 ? '276221' : '9C0006' } },
      });
    }

    // Linhas alternadas na tabela mensal
    monthlyData.forEach((_, idx) => {
      const rowIdx = monthlyStart + idx;
      if (idx % 2 === 1) {
        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
          applyStyle(ws, `${col}${rowIdx + 1}`, styles.alternateRow);
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
      'Nº Parcela',
      'Total Parcelas',
      'Recorrente',
      'Cartão',
      'Categoria',
      'Mês Fatura',
      'Data Vencimento',
    ];

    const formatDateBR = (dateStr) => {
      if (!dateStr) return '';
      const parts = String(dateStr).split('-');
      if (parts.length !== 3) return dateStr;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const data = [headers];

    transactions.forEach(t => {
      const effectiveStatus = t.parcela_status || t.status || '';
      data.push([
        t.id || '',
        t.created_at_formatted || '',
        t.month_label || '',
        t.type === 'credit' ? 'Crédito' : t.type === 'debit' ? 'Débito' : t.type || '',
        effectiveStatus === 'paid' ? 'Pago' : effectiveStatus === 'pending' ? 'Pendente' : effectiveStatus,
        t.title || '',
        t.description || '',
        parseFloat(t.amount) || 0,
        parseFloat(t.installment_amount) || parseFloat(t.amount) || 0,
        t.display_installment || t.current_installment || '',
        t.total_installments || '',
        t.is_recurring ? 'Sim' : 'Não',
        t.bank_user?.bank?.name || '',
        t.category?.name || '',
        t.invoice_month_label || t.month_label || '',
        formatDateBR(t.due_date),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Larguras
    ws['!cols'] = [
      { wch: 8 },  // ID
      { wch: 16 }, // Data
      { wch: 15 }, // Mês/Ano
      { wch: 10 }, // Tipo
      { wch: 11 }, // Status
      { wch: 30 }, // Título
      { wch: 40 }, // Descrição
      { wch: 15 }, // Valor Total
      { wch: 15 }, // Valor Parcela
      { wch: 11 }, // Nº Parcela
      { wch: 12 }, // Total Parcelas
      { wch: 10 }, // Recorrente
      { wch: 22 }, // Cartão
      { wch: 22 }, // Categoria
      { wch: 15 }, // Mês Fatura
      { wch: 16 }, // Data Vencimento
    ];

    // Linha de cabeçalho com altura maior
    ws['!rows'] = [{ hpx: 28 }];

    // Congelar primeira linha
    ws['!sheetViews'] = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }];

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

      // Cor do Status (sobrescreve linhas alternadas)
      const statusCell = XLSX.utils.encode_cell({ r: row, c: 4 });
      if (ws[statusCell]) {
        const statusVal = ws[statusCell].v;
        if (statusVal === 'Pago') {
          applyStyle(ws, statusCell, {
            fill: { patternType: 'solid', fgColor: { rgb: 'C6EFCE' } },
            font: { bold: false, color: { rgb: '276221' } },
            border: styles.border,
            alignment: { horizontal: 'center' },
          });
        } else if (statusVal === 'Pendente') {
          applyStyle(ws, statusCell, {
            fill: { patternType: 'solid', fgColor: { rgb: 'FFEB9C' } },
            font: { bold: false, color: { rgb: '9C5700' } },
            border: styles.border,
            alignment: { horizontal: 'center' },
          });
        }
      }
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

    ws['!rows'] = [{ hpx: 28 }];
    ws['!sheetViews'] = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }];

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

  // Criar aba de Análise por Cartão
  const createBankAnalysisSheet = (bankData, totalAmount) => {
    const headers = [
      'Cartão',
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

    ws['!rows'] = [{ hpx: 28 }];
    ws['!sheetViews'] = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }];

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

  // Criar aba de Top Transações
  const createTopTransactionsSheet = (topTransactions) => {
    const headers = [
      'Ranking',
      'Título',
      'Categoria',
      'Banco',
      'Valor',
      'Data',
      'Status',
      'Tipo',
      'Recorrente'
    ];

    const data = [headers];

    topTransactions.forEach((t, idx) => {
      data.push([
        idx + 1,
        t.title || '',
        t.category?.name || 'Sem categoria',
        t.bank_user?.bank?.name || 'Sem cartão',
        t.display_amount,
        t.created_at_formatted || '',
        t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : t.status || '',
        t.type === 'credit' ? 'Crédito' : t.type === 'debit' ? 'Débito' : t.type || '',
        t.is_recurring ? 'Sim' : 'Não'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Larguras
    ws['!cols'] = [
      { wch: 8 },  // Ranking
      { wch: 30 }, // Título
      { wch: 20 }, // Categoria
      { wch: 20 }, // Banco
      { wch: 15 }, // Valor
      { wch: 16 }, // Data
      { wch: 10 }, // Status
      { wch: 10 }, // Tipo
      { wch: 10 }  // Recorrente
    ];

    ws['!rows'] = [{ hpx: 28 }];
    ws['!sheetViews'] = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }];

    // Estilizar cabeçalho
    headers.forEach((_, idx) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c: idx });
      applyStyle(ws, cell, styles.header);
    });

    // Estilizar dados
    topTransactions.forEach((_, rowIdx) => {
      const row = rowIdx + 1;
      
      // Valor monetário
      const valueCell = XLSX.utils.encode_cell({ r: row, c: 4 });
      if (ws[valueCell]) applyStyle(ws, valueCell, styles.currency);

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

  // Criar aba de Análise de Tendências
  const createTrendsSheet = (trendsData) => {
    if (!trendsData || !trendsData.trends) {
      const ws = XLSX.utils.aoa_to_sheet([['Dados insuficientes para análise de tendências']]);
      return ws;
    }

    const data = [
      ['ANÁLISE DE TENDÊNCIAS'],
      [],
      ['Crescimento Médio:', trendsData.average_growth / 100],
      ['Mês Maior Gasto:', trendsData.highest_month?.month || 'N/A', trendsData.highest_month?.total_amount || 0],
      ['Mês Menor Gasto:', trendsData.lowest_month?.month || 'N/A', trendsData.lowest_month?.total_amount || 0],
      [],
      ['EVOLUÇÃO MENSAL'],
      ['Mês', 'Valor Atual', 'Valor Anterior', 'Variação R$', 'Taxa de Crescimento']
    ];

    trendsData.trends.forEach(trend => {
      data.push([
        trend.month,
        trend.amount,
        trend.previous_amount,
        trend.variation,
        trend.growth_rate / 100
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Larguras
    ws['!cols'] = [
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 }
    ];

    // Estilos
    applyStyle(ws, 'A1', { ...styles.title, alignment: { horizontal: "center" } });
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

    // Cabeçalho da tabela
    ['A8', 'B8', 'C8', 'D8', 'E8'].forEach(cell => {
      applyStyle(ws, cell, styles.header);
    });

    // Formatar valores
    applyStyle(ws, 'B3', styles.percentage);
    applyStyle(ws, 'C4', styles.currency);
    applyStyle(ws, 'C5', styles.currency);

    // Formatar dados da tabela
    trendsData.trends.forEach((_, idx) => {
      const row = 9 + idx;
      ['B', 'C', 'D'].forEach(col => {
        const cell = `${col}${row}`;
        if (ws[cell]) applyStyle(ws, cell, styles.currency);
      });

      const percentCell = `E${row}`;
      if (ws[percentCell]) applyStyle(ws, percentCell, styles.percentage);

      // Linhas alternadas
      if (idx % 2 === 1) {
        ['A', 'B', 'C', 'D', 'E'].forEach(col => {
          applyStyle(ws, `${col}${row}`, styles.alternateRow);
        });
      }
    });

    return ws;
  };

  // Criar aba de Análise de Recorrentes
  const createRecurringAnalysisSheet = (recurringData) => {
    const data = [
      ['ANÁLISE DE GASTOS RECORRENTES VS NÃO RECORRENTES'],
      [],
      ['GASTOS RECORRENTES'],
      ['Quantidade de Transações', recurringData.recurring_count],
      ['Valor Total', recurringData.recurring_total],
      ['Ticket Médio', recurringData.recurring_average],
      ['Percentual do Total', recurringData.recurring_percentage / 100],
      [],
      ['GASTOS NÃO RECORRENTES'],
      ['Quantidade de Transações', recurringData.non_recurring_count],
      ['Valor Total', recurringData.non_recurring_total],
      ['Ticket Médio', recurringData.non_recurring_average],
      ['Percentual do Total', (100 - recurringData.recurring_percentage) / 100],
      [],
      ['COMPARATIVO'],
      ['Métrica', 'Recorrentes', 'Não Recorrentes'],
      ['Quantidade', recurringData.recurring_count, recurringData.non_recurring_count],
      ['Valor Total', recurringData.recurring_total, recurringData.non_recurring_total],
      ['Ticket Médio', recurringData.recurring_average, recurringData.non_recurring_average],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Larguras
    ws['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 20 }
    ];

    // Estilos
    applyStyle(ws, 'A1', { ...styles.title, alignment: { horizontal: "center" } });
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];

    ['A3', 'A9', 'A15'].forEach(cell => {
      applyStyle(ws, cell, styles.subHeader);
    });

    // Cabeçalho da tabela comparativa
    ['A16', 'B16', 'C16'].forEach(cell => {
      applyStyle(ws, cell, styles.header);
    });

    // Formatar valores
    [5, 6, 11, 12, 18, 19].forEach(row => {
      ['B', 'C'].forEach(col => {
        const cell = `${col}${row}`;
        if (ws[cell] && typeof ws[cell].v === 'number') {
          applyStyle(ws, cell, styles.currency);
        }
      });
    });

    [7, 13].forEach(row => {
      const cell = `B${row}`;
      if (ws[cell]) applyStyle(ws, cell, styles.percentage);
    });

    // Linhas alternadas na tabela
    [17, 18, 19].forEach((row, idx) => {
      if (idx % 2 === 1) {
        ['A', 'B', 'C'].forEach(col => {
          applyStyle(ws, `${col}${row}`, styles.alternateRow);
        });
      }
    });

    return ws;
  };

  // Criar aba de Fluxo de Caixa Mensal
  const createCashflowSheet = (monthlyData) => {
    const headers = [
      'Mês',
      'Receitas',
      'Despesas',
      'Saldo do Mês',
      'Saldo Acumulado',
      'Taxa de Poupança',
      'Qtd Transações',
    ];

    const data = [headers];
    let cumulative = 0;

    monthlyData.forEach(month => {
      const income = month.total_debit;
      const expenses = month.total_credit;
      const net = income - expenses;
      cumulative += net;
      const savingsRate = income > 0 ? net / income : (expenses > 0 ? -1 : 0);
      data.push([month.month, income, expenses, net, cumulative, savingsRate, month.count]);
    });

    const totalIncome = monthlyData.reduce((s, m) => s + m.total_debit, 0);
    const totalExpenses = monthlyData.reduce((s, m) => s + m.total_credit, 0);
    const totalNet = totalIncome - totalExpenses;
    const totalSavingsRate = totalIncome > 0 ? totalNet / totalIncome : 0;
    const totalCount = monthlyData.reduce((s, m) => s + m.count, 0);
    data.push(['TOTAL', totalIncome, totalExpenses, totalNet, totalNet, totalSavingsRate, totalCount]);

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [
      { wch: 18 }, { wch: 16 }, { wch: 16 },
      { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 14 },
    ];
    ws['!rows'] = [{ hpx: 28 }];
    ws['!sheetViews'] = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2', activeCell: 'A2' }];
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 2, c: headers.length - 1 } }) };

    headers.forEach((_, idx) => {
      applyStyle(ws, XLSX.utils.encode_cell({ r: 0, c: idx }), styles.header);
    });

    let runningCumulative = 0;
    monthlyData.forEach((month, rowIdx) => {
      const row = rowIdx + 1;
      const net = month.total_debit - month.total_credit;
      runningCumulative += net;

      // Moeda: Receitas, Despesas, Saldo do Mês, Saldo Acumulado
      [1, 2, 3, 4].forEach(colIdx => {
        const cell = XLSX.utils.encode_cell({ r: row, c: colIdx });
        if (ws[cell]) applyStyle(ws, cell, styles.currency);
      });

      // Percentual: Taxa de Poupança
      const pctCell = XLSX.utils.encode_cell({ r: row, c: 5 });
      if (ws[pctCell]) applyStyle(ws, pctCell, styles.percentage);

      // Linhas alternadas (apenas nas colunas não coloridas)
      if (rowIdx % 2 === 1) {
        [0, 1, 2, 5, 6].forEach(colIdx => {
          applyStyle(ws, XLSX.utils.encode_cell({ r: row, c: colIdx }), styles.alternateRow);
        });
      }

      // Bordas
      headers.forEach((_, colIdx) => {
        applyStyle(ws, XLSX.utils.encode_cell({ r: row, c: colIdx }), { border: styles.border });
      });

      // Colorir Saldo do Mês (verde = superávit, vermelho = déficit)
      const netCell = XLSX.utils.encode_cell({ r: row, c: 3 });
      if (ws[netCell]) {
        applyStyle(ws, netCell, {
          numFmt: 'R$ #,##0.00',
          alignment: { horizontal: 'right' },
          font: { bold: false, color: { rgb: net >= 0 ? '276221' : '9C0006' } },
          fill: { patternType: 'solid', fgColor: { rgb: net >= 0 ? 'C6EFCE' : 'FFC7CE' } },
          border: styles.border,
        });
      }

      // Colorir Saldo Acumulado
      const cumCell = XLSX.utils.encode_cell({ r: row, c: 4 });
      if (ws[cumCell]) {
        applyStyle(ws, cumCell, {
          numFmt: 'R$ #,##0.00',
          alignment: { horizontal: 'right' },
          font: { bold: false, color: { rgb: runningCumulative >= 0 ? '276221' : '9C0006' } },
          border: styles.border,
        });
      }
    });

    // Linha de total
    const totalRow = data.length - 1;
    headers.forEach((_, colIdx) => {
      const cell = XLSX.utils.encode_cell({ r: totalRow, c: colIdx });
      applyStyle(ws, cell, styles.totalRow);
      if ([1, 2, 3, 4].includes(colIdx)) applyStyle(ws, cell, { ...styles.totalRow, ...styles.currency });
      if (colIdx === 5) applyStyle(ws, cell, { ...styles.totalRow, ...styles.percentage });
    });

    const totalNetCell = XLSX.utils.encode_cell({ r: totalRow, c: 3 });
    if (ws[totalNetCell]) {
      applyStyle(ws, totalNetCell, {
        ...styles.totalRow,
        numFmt: 'R$ #,##0.00',
        font: { bold: true, color: { rgb: totalNet >= 0 ? '276221' : '9C0006' } },
      });
    }

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
      const topTransactions = getTopTransactions(data, 20);
      const recurringData = analyzeRecurring(data);
      const trendsData = analyzeTrends(monthlyData);

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
      XLSX.utils.book_append_sheet(workbook, bankSheet, 'Análise por Cartão');

      const topSheet = createTopTransactionsSheet(topTransactions);
      XLSX.utils.book_append_sheet(workbook, topSheet, 'Top 20 Transações');

      const recurringSheet = createRecurringAnalysisSheet(recurringData);
      XLSX.utils.book_append_sheet(workbook, recurringSheet, 'Recorrentes vs Não Recorr.');

      if (trendsData) {
        const trendsSheet = createTrendsSheet(trendsData);
        XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Tendências');
      }

      const cashflowSheet = createCashflowSheet(monthlyData);
      XLSX.utils.book_append_sheet(workbook, cashflowSheet, 'Fluxo de Caixa');

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
    <Tooltip label="Exportar relatório detalhado e completo com 7 abas de análises">
      <BareButton className="btn-primary" onClick={exportDetailedReport}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
          <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V9H3V2a1 1 0 0 1 1-1h5.5zM3 12v-2h2v2zm0 1h2v2H4a1 1 0 0 1-1-1zm3 2v-2h3v2zm4 0v-2h3v1a1 1 0 0 1-1 1zm3-3h-3v-2h3zm-7 0v-2h3v2z"/>
        </svg>
      </BareButton>
    </Tooltip>
  );
}
