import React, { useMemo, useState } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Modal from '@/Components/common/Modal';
import { formatCurrency } from '@/Utils/bills';
import { getIconEmoji } from '@/Utils/categoryIcons';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Banknote, CalendarDays, Hash, Pencil, X, Save, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const isDark = () => document.documentElement.classList.contains('dark');

const STATUS_STYLE = {
    paid: {
        label: 'Pago',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    },
    pending: {
        label: 'Pendente',
        icon: <Clock className="w-3.5 h-3.5" />,
        className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    },
    overdue: {
        label: 'Vencido',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    },
};

function formatMonthShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

function formatDateBR(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
}

export default function BillHistoryModal({ isOpen, onClose, bill, onPaymentUpdated }) {
    const dark = isDark();

    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [editForm, setEditForm] = useState({ amount_due: '', amount_paid: '', paid_date: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [deletingPaymentId, setDeletingPaymentId] = useState(null);

    const history = useMemo(() => (bill?.payment_history || []), [bill]);
    const stats = useMemo(() => (bill?.payment_stats || {}), [bill]);

    const chartData = useMemo(() => {
        const sorted = [...history]
            .sort((a, b) => a.due_date.localeCompare(b.due_date))
            .slice(-12);

        const tooltipBg = dark ? 'rgba(15,15,23,0.96)' : 'rgba(255,255,255,0.98)';
        const tooltipBdr = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
        const tooltipTxt = dark ? '#f9fafb' : '#111827';
        const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        const tickColor = dark ? '#9ca3af' : '#6b7280';

        return {
            labels: sorted.map((p) => formatMonthShort(p.due_date)),
            datasets: [
                {
                    label: 'Valor pago',
                    data: sorted.map((p) => p.amount_paid),
                    backgroundColor: 'rgba(16,185,129,0.75)',
                    borderRadius: 5,
                    borderSkipped: false,
                },
                {
                    label: 'Valor previsto',
                    data: sorted.map((p) => p.amount_due || bill?.amount || 0),
                    backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                    borderRadius: 5,
                    borderSkipped: false,
                },
            ],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: { color: tickColor, boxWidth: 10, boxHeight: 10, borderRadius: 3, useBorderRadius: true, font: { size: 11 }, padding: 10 },
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBdr,
                        borderWidth: 1,
                        titleColor: tooltipTxt,
                        bodyColor: tooltipTxt,
                        padding: 10,
                        callbacks: {
                            label: (ctx) => ` ${formatCurrency(ctx.raw)}`,
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: tickColor, font: { size: 11 } },
                        border: { display: false },
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: tickColor,
                            font: { size: 11 },
                            callback: (v) =>
                                new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1, style: 'currency', currency: 'BRL' }).format(v),
                        },
                        border: { display: false },
                    },
                },
            },
        };
    }, [history, dark, bill]);

    if (!bill) return null;

    const openEdit = (p) => {
        setEditingPaymentId(p.id);
        setEditForm({
            amount_due: String(p.amount_due ?? bill?.amount ?? '').replace('.', ','),
            amount_paid: String(p.amount_paid).replace('.', ','),
            paid_date: p.paid_date || p.due_date,
            notes: p.notes || '',
        });
    };

    const cancelEdit = () => {
        setEditingPaymentId(null);
    };

    const deletePayment = async (paymentId) => {
        if (saving) return;
        setSaving(true);
        try {
            await axios.delete(route('bills.payment.destroy', [bill.id, paymentId]));
            toast.success('Pagamento removido do histórico.');
            setDeletingPaymentId(null);
            onPaymentUpdated?.();
        } catch (err) {
            const msg = err.response?.data?.message || 'Erro ao remover pagamento.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const saveEdit = async (paymentId) => {
        if (saving) return;
        const normalized = editForm.amount_paid.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(normalized);
        if (isNaN(parsed) || parsed <= 0) {
            toast.error('Informe um valor válido.');
            return;
        }
        const normalizedDue = editForm.amount_due.replace(/\./g, '').replace(',', '.');
        const parsedDue = parseFloat(normalizedDue);
        if (isNaN(parsedDue) || parsedDue < 0) {
            toast.error('Informe um valor previsto válido.');
            return;
        }
        setSaving(true);
        try {
            await axios.patch(route('bills.payment.update', [bill.id, paymentId]), {
                amount_due: parsedDue,
                amount_paid: parsed,
                paid_date: editForm.paid_date,
                notes: editForm.notes || null,
            });
            toast.success('Pagamento atualizado.');
            setEditingPaymentId(null);
            onPaymentUpdated?.();
        } catch (err) {
            const msg = err.response?.data?.message || 'Erro ao atualizar pagamento.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const billIcon = bill.category?.icon ? (getIconEmoji(bill.category.icon) || bill.category.icon) : '📋';

    const statCards = [
        {
            icon: <Hash className="w-4 h-4" />,
            label: 'Pagamentos',
            value: stats.payments_count ?? 0,
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        },
        {
            icon: <Banknote className="w-4 h-4" />,
            label: 'Total este ano',
            value: formatCurrency(stats.total_paid_this_year ?? 0),
            color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        },
        {
            icon: <TrendingUp className="w-4 h-4" />,
            label: 'Média paga',
            value: formatCurrency(stats.avg_paid ?? 0),
            color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        },
        {
            icon: <CalendarDays className="w-4 h-4" />,
            label: 'Último pagamento',
            value: formatDateBR(stats.last_payment_date),
            color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Histórico de Pagamentos" maxWidth="2xl">
            <div className="space-y-5 p-1">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                    <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                        style={{ backgroundColor: (bill.color || '#3b82f6') + '20', color: bill.color || '#3b82f6' }}
                    >
                        {billIcon}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{bill.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Valor previsto: {formatCurrency(bill.amount)} · {bill.recurrence_type === 'monthly' ? 'Mensal' : bill.recurrence_type === 'yearly' ? 'Anual' : 'Única'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {statCards.map((s) => (
                        <div key={s.label} className="rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-900/40 p-3 flex flex-col gap-1.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{s.label}</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{s.value}</p>
                        </div>
                    ))}
                </div>

                {history.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Últimos 12 meses</p>
                        <div className="h-40 sm:h-48">
                            <Bar data={chartData} options={chartData.options} />
                        </div>
                    </div>
                )}

                <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Histórico detalhado</p>
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 dark:text-gray-500">
                            <CheckCircle2 className="w-8 h-8 mb-2 opacity-40" />
                            <p className="text-sm">Nenhum pagamento registrado ainda.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                                        <th className="text-left px-3 py-2.5 font-medium">Vencimento</th>
                                        <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Data Pago</th>
                                        <th className="text-right px-3 py-2.5 font-medium">Previsto</th>
                                        <th className="text-right px-3 py-2.5 font-medium">Pago</th>
                                        <th className="text-center px-3 py-2.5 font-medium">Status</th>
                                        <th className="w-20"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {history.map((p) => {
                                        const s = STATUS_STYLE[p.status] || STATUS_STYLE.paid;
                                        const diff = p.amount_paid - (p.amount_due || bill?.amount || p.amount_paid);
                                        const isEditing = editingPaymentId === p.id;

                                        if (isEditing) {
                                            return (
                                                <tr key={p.id} className="bg-theme-accent/5 dark:bg-theme-accent/10">
                                                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-medium">{formatDateBR(p.due_date)}</td>
                                                    <td className="px-3 py-2 hidden sm:table-cell">
                                                        <input
                                                            type="date"
                                                            value={editForm.paid_date}
                                                            onChange={(e) => setEditForm((f) => ({ ...f, paid_date: e.target.value }))}
                                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-theme-accent"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={editForm.amount_due}
                                                            onChange={(e) => {
                                                                let v = e.target.value.replace(/[^0-9.,]/g, '');
                                                                setEditForm((f) => ({ ...f, amount_due: v }));
                                                            }}
                                                            className="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-right text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-theme-accent"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={editForm.amount_paid}
                                                            onChange={(e) => {
                                                                let v = e.target.value.replace(/[^0-9.,]/g, '');
                                                                setEditForm((f) => ({ ...f, amount_paid: v }));
                                                            }}
                                                            className="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-right text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-theme-accent"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={editForm.notes}
                                                            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                                                            placeholder="Obs..."
                                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-theme-accent"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <div className="flex items-center gap-1 justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => saveEdit(p.id)}
                                                                disabled={saving}
                                                                className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                                                                title="Salvar"
                                                            >
                                                                <Save className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                disabled={saving}
                                                                className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                                title="Cancelar"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return (
                                            <tr key={p.id} className="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group/row">
                                                <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 font-medium">{formatDateBR(p.due_date)}</td>
                                                <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{formatDateBR(p.paid_date)}</td>
                                                <td className="px-3 py-2.5 text-right text-gray-500 dark:text-gray-400">{formatCurrency(p.amount_due || bill?.amount)}</td>
                                                <td className="px-3 py-2.5 text-right font-semibold">
                                                    <span className={diff > 0 ? 'text-red-500 dark:text-red-400' : diff < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}>
                                                        {formatCurrency(p.amount_paid)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mx-auto w-fit ${s.className}`}>
                                                        {s.icon}
                                                        {s.label}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-2.5">
                                                    {p.status === 'paid' && (
                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-all">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEdit(p)}
                                                                className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 hover:text-theme-accent hover:bg-theme-accent/10 transition-colors"
                                                                title="Editar pagamento"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
                                                            {deletingPaymentId === p.id ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deletePayment(p.id)}
                                                                        disabled={saving}
                                                                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                                                        title="Confirmar remoção"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDeletingPaymentId(null)}
                                                                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                                        title="Cancelar"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeletingPaymentId(p.id)}
                                                                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                    title="Remover pagamento"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
