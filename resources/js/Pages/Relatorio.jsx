import React, { useEffect, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-toastify";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ReportExportButtons from "@/Components/system/reports/ReportExportButtons";
import StatCard from "@/Components/system/dashboard/StatCard";
import ReportsMonthlySummary from "@/Components/system/reports/ReportsMonthlySummary";
import ReportsPeriodSelector from "@/Components/system/reports/ReportsPeriodSelector";
import ReportsPeriodModal from "@/Components/system/reports/ReportsPeriodModal";
import ReportsInsightsBar from "@/Components/system/reports/ReportsInsightsBar";
import ReportsCategoryBreakdown from "@/Components/system/reports/ReportsCategoryBreakdown";
import ReportsCardBreakdown from "@/Components/system/reports/ReportsCardBreakdown";
import FaturaDetailModal from "@/Components/system/fatura/FaturaDetailModal";
import { formatCurrencyBRL } from "@/Lib/formatters";
import FadeInContainer, { FadeInItem } from "@/Components/common/FadeInContainer";

export default function Relatorio({ bankAccounts = [], categories = [], incomes = [], totalMonthlyIncome = 0 }) {
	const [selectedBankId, setSelectedBankId] = useState("");
	const [selectedCategoryId, setSelectedCategoryId] = useState("");
	const [stats, setStats] = useState({
		total_income: 0,
		total_expenses: 0,
		pending_income: 0,
		pending_expenses: 0,
		current_month_debit_total: 0,
		overdue_count: 0,
	});
	const [monthlySummary, setMonthlySummary] = useState([]);
	const [periodGroups, setPeriodGroups] = useState([]);
	const [selectedPeriodKey, setSelectedPeriodKey] = useState("");
	const [selectedTransaction, setSelectedTransaction] = useState(null);
	const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [allTransactions, setAllTransactions] = useState([]);

	useEffect(() => {
		let isMounted = true;
		const load = async () => {
			setIsLoading(true);
			try {
				// Single consolidated request instead of 2 separate ones
				const response = await axios.get(route("reports.data"), {
					params: {
						bank_user_id: selectedBankId || undefined,
						category_id: selectedCategoryId || undefined,
					},
				});

				if (!isMounted) return;

				const payload = response.data?.stats || {};
				setStats({
					total_income: Number(payload.total_income || 0),
					total_expenses: Number(payload.total_expenses || 0),
					pending_income: Number(payload.pending_income || 0),
					pending_expenses: Number(payload.pending_expenses || 0),
					current_month_debit_total: Number(payload.current_month_debit_total || 0),
					overdue_count: Number(payload.overdue_count || 0),
				});

				const normalizeTransaction = (item) => {
					const periodKey = item.invoice_month || item.year_month || "sem-data";
					const periodLabel = item.invoice_month_label || item.month_label || "Sem data";

					return {
						...item,
						period_key: periodKey,
						period_label: periodLabel,
						bank_name: item.bank_user?.bank?.name || item.bank_user?.card?.name || "Sem cartão",
						category_name: item.category?.name || "Sem categoria",
						category_icon: item.category?.icon || null,
						category_color: item.category?.color || null,
						display_installment: item.display_installment || item.current_installment,
						installment_amount: Number(item.installment_amount ?? item.amount ?? 0),
						amount: Number(item.amount || 0),
					};
				};

				const raw = Array.isArray(response.data?.export_data) ? response.data.export_data : [];
				const normalized = raw.map(normalizeTransaction);

				const grouped = normalized.reduce((acc, item) => {
					const key = item.period_key;
					if (!acc[key]) {
						acc[key] = {
							key,
							label: item.period_label,
							total_amount: 0,
							total_credit: 0,
							total_debit: 0,
							count: 0,
							installment_count: 0,
							installment_total: 0,
							transactions: [],
						};
					}

					const debitAmount = item.type === "debit" ? item.amount || 0 : 0;
					const creditInstallment = item.type === "credit" ? item.installment_amount || 0 : 0;
					const isInstallment = item.type === "credit" && Number(item.total_installments || 0) > 1;

					acc[key].total_debit += debitAmount;
					acc[key].total_credit += creditInstallment;
					acc[key].total_amount = acc[key].total_credit + acc[key].total_debit;
					acc[key].count += 1;
					if (isInstallment) {
						acc[key].installment_count += 1;
						acc[key].installment_total += creditInstallment;
					}
					acc[key].transactions.push(item);
					return acc;
				}, {});

				const sortedGroups = Object.values(grouped).sort((a, b) => (a.key || "").localeCompare(b.key || ""));

				setPeriodGroups(sortedGroups);
				setAllTransactions(normalized);
				setMonthlySummary(
					sortedGroups.map((group) => ({
						year_month: group.key,
						month_label: group.label,
						total_amount: group.total_amount,
						total_credit: group.total_credit,
						total_debit: group.total_debit,
						count: group.count,
						installment_count: group.installment_count,
						installment_total: group.installment_total,
					}))
				);

				const fallbackKey = sortedGroups[sortedGroups.length - 1]?.key || "";
				setSelectedPeriodKey((prev) => (sortedGroups.some((group) => group.key === prev) ? prev : fallbackKey));
			} catch (error) {
				console.error(error);
				if (error.response?.data?.message) {
					toast.error(error.response.data.message);
				} else {
					toast.error("Não foi possível carregar os dados do relatório.");
				}
			} finally {
				if (isMounted) setIsLoading(false);
			}
		};

		load();

		return () => {
			isMounted = false;
		};
	}, [selectedBankId, selectedCategoryId]);

	const selectedPeriod = useMemo(
		() => periodGroups.find((group) => group.key === selectedPeriodKey) || null,
		[periodGroups, selectedPeriodKey],
	);

	const insights = useMemo(() => {
		const totalAmount = periodGroups.reduce((sum, group) => sum + (group.total_amount || 0), 0);
		const totalCount = periodGroups.reduce(
			(sum, group) => sum + (Array.isArray(group.transactions) ? group.transactions.length : 0),
			0,
		);
		const averageTicket = totalCount > 0 ? totalAmount / totalCount : 0;
		const topExpense = [...periodGroups].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))[0];

		// Use monthly average expense vs declared monthly income for a meaningful savings rate
		const periodCount = Math.max(periodGroups.length, 1);
		const avgMonthlyExpense = totalAmount / periodCount;
		const savingsRate = totalMonthlyIncome > 0
			? ((totalMonthlyIncome - avgMonthlyExpense) / totalMonthlyIncome) * 100
			: 0;

		const monthlyAvg = periodGroups.length > 0
			? totalAmount / periodGroups.length
			: 0;

		return {
			netBalance: (stats.total_income || 0) - (stats.total_expenses || 0),
			averageTicket,
			topExpenseLabel: topExpense?.label || "",
			topExpenseValue: topExpense?.total_amount || 0,
			savingsRate: Math.max(savingsRate, 0),
			monthlyAvg,
			totalTransactions: totalCount,
		};
	}, [periodGroups, stats.total_expenses, stats.total_income, totalMonthlyIncome]);

	const handleOpenPeriodModal = (key) => {
		const resolved = key || selectedPeriodKey || periodGroups[periodGroups.length - 1]?.key || "";
		if (!resolved) return;
		setSelectedPeriodKey(resolved);
		setIsPeriodModalOpen(true);
	};

	const handleClosePeriodModal = () => {
		setIsPeriodModalOpen(false);
	};

	const handleSelectTransaction = (transaction) => {
		setSelectedTransaction(transaction);
	};

	return (
		<AuthenticatedLayout>
			<Head title="Relatórios" />

			<FadeInContainer className="w-full max-w-[1450px] 2xl:max-w-[1500px] mx-auto px-3 py-3 space-y-4 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
				<FadeInItem type="fast">
					<header className="space-y-1.5 pt-0.5 sm:pt-1">
						<h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-gray-100">
							Relatórios
						</h1>
						<p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 max-w-4xl">
							Acompanhe todas as suas transações em faturas, veja um resumo financeiro por período, filtre por cartão e categoria e exporte um arquivo Excel completo.
						</p>
					</header>
				</FadeInItem>

				<FadeInItem type="subtle"><section className="rounded-2xl p-3 shadow-md themed-card sm:p-3 lg:p-4 space-y-3">
					<div className="flex flex-col gap-2 text-xs sm:text-sm sm:flex-row sm:items-center sm:justify-between">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
							<div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
								<label className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300 sm:hidden">
									💳 Cartão
								</label>
								<select
									value={selectedBankId}
									onChange={(e) => setSelectedBankId(e.target.value)}
									className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 sm:min-w-[200px]"
									aria-label="Filtrar por cartão"
								>
									<option value="">Todos os cartões</option>
									{bankAccounts.map((account) => (
										<option key={account.id} value={account.id}>
											{account.name}
										</option>
									))}
								</select>
							</div>

							<div className="flex w-full flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
								<label className="text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300 sm:hidden">
									📂 Categoria
								</label>
								<select
									value={selectedCategoryId}
									onChange={(e) => setSelectedCategoryId(e.target.value)}
									className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100 sm:min-w-[200px]"
									aria-label="Filtrar por categoria"
								>
									<option value="">Todas as categorias</option>
									{categories.map((category) => (
										<option key={category.id} value={category.id}>
											{category.name}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="flex justify-end w-full sm:w-auto">
							<ReportExportButtons
								filters={{
									bank_user_id: selectedBankId || undefined,
									category_id: selectedCategoryId || undefined,
								}}
							/>
						</div>
					</div>
				</section>
			</FadeInItem>

			<FadeInContainer stagger className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<FadeInItem type="feature">
					<ReportsPeriodSelector
						periods={periodGroups}
						selectedKey={selectedPeriodKey}
						onChange={setSelectedPeriodKey}
						onOpen={handleOpenPeriodModal}
						isLoading={isLoading}
					/>
				</FadeInItem>
				<FadeInItem type="feature">
					<ReportsInsightsBar insights={insights} />
				</FadeInItem>
			</FadeInContainer>

			<FadeInContainer stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<FadeInItem type="feature">
					<StatCard title="Renda mensal total" value={formatCurrencyBRL(totalMonthlyIncome)} delta={`${incomes.filter(i => i.is_active).length} fonte(s) ativa(s)`} />
				</FadeInItem>
				<FadeInItem type="feature">
					<StatCard title="Receitas pagas" value={formatCurrencyBRL(stats.total_income)} />
				</FadeInItem>
				<FadeInItem type="feature">
					<StatCard title="Despesas pagas" value={formatCurrencyBRL(stats.total_expenses)} />
				</FadeInItem>
				<FadeInItem type="feature">
					<StatCard title="Balanço líquido" value={formatCurrencyBRL(totalMonthlyIncome - stats.total_expenses - stats.current_month_debit_total)} />
				</FadeInItem>
				<FadeInItem type="feature">
					<StatCard title="Receitas pendentes" value={formatCurrencyBRL(stats.pending_income)} />
				</FadeInItem>
				<FadeInItem type="feature">
					<StatCard title="Despesas pendentes" value={formatCurrencyBRL(stats.pending_expenses)} />
				</FadeInItem>
				<FadeInItem type="feature">
					<StatCard
						title="Transações no débito (mês atual)"
						value={formatCurrencyBRL(stats.current_month_debit_total)}
					/>
				</FadeInItem>
				<FadeInItem type="feature">
					<StatCard title="Faturas vencidas" value={stats.overdue_count} />
				</FadeInItem>
			</FadeInContainer>

			{/* Category & Card Breakdowns */}
			{!isLoading && allTransactions.length > 0 && (
				<FadeInContainer stagger className="grid grid-cols-1 gap-3 lg:grid-cols-2">
					<FadeInItem type="feature">
						<ReportsCategoryBreakdown transactions={allTransactions} />
					</FadeInItem>
					<FadeInItem type="feature">
						<ReportsCardBreakdown transactions={allTransactions} />
					</FadeInItem>
				</FadeInContainer>
			)}

			<FadeInItem type="subtle">
				<section className="space-y-3">
					<div className="flex items-center justify-between gap-2">
						<h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
							Resumo por mês / ano
						</h2>
						{isLoading && (
							<span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
								Carregando dados...
							</span>
						)}
					</div>
					<ReportsMonthlySummary items={monthlySummary} onSelectPeriod={handleOpenPeriodModal} />
				</section>
			</FadeInItem>

		<ReportsPeriodModal
			isOpen={isPeriodModalOpen}
			onClose={handleClosePeriodModal}
			period={selectedPeriod}
			onSelectTransaction={handleSelectTransaction}
		/>

		<FaturaDetailModal
			isOpen={!!selectedTransaction}
			onClose={() => setSelectedTransaction(null)}
			item={selectedTransaction}
		/>
	</FadeInContainer>
		</AuthenticatedLayout>
	);
}