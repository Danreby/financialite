import { useEffect, useLayoutEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import {
    ArrowLeftRight,
    CalendarClock,
    CreditCard,
    Pencil,
    Plus,
    ReceiptText,
    SearchX,
    ShoppingBag,
    Trash2,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { applyAppearance, useTheme } from '@/Contexts/ThemeContext';
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer';
import FinancialIcon from '@/Components/common/icons/FinancialIcon';
import LegacyEmptyState from '@/Components/common/EmptyState';
import {
    AlertItem,
    Badge,
    Button,
    Card,
    ConfirmDialog,
    EmptyState,
    Field,
    Input,
    Kbd,
    MoneyInput,
    MoneyText,
    PageHeader,
    PriorityBadge,
    ProgressBar,
    SearchInput,
    SegmentedControl,
    Select,
    Skeleton,
    Spinner,
    StatCard,
    Switch,
    Table,
    TBody,
    TCell,
    TH,
    THead,
    TRow,
    TransactionRow,
} from '@/Components/ui';

function Section({ title, note, children }) {
    return (
        <section className="flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-semibold tracking-tight text-content-primary">{title}</h2>
                {note && <p className="mt-0.5 text-sm text-content-muted">{note}</p>}
            </div>
            {children}
        </section>
    );
}

function Row({ label, children }) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="w-28 shrink-0 text-xs font-medium text-content-muted">{label}</span>
            <div className="flex flex-wrap items-center gap-2">{children}</div>
        </div>
    );
}

const PERIODS = [
    { value: '7', label: '7 dias' },
    { value: '30', label: '30 dias' },
    { value: 'all', label: 'Tudo' },
];

const ACTIVITY = [
    { date: '18/11', event: 'Mercado Bom Preço', category: 'Alimentação', amount: 312.4, type: 'expense' },
    { date: '15/11', event: 'Salário', category: 'Receita', amount: 6800, type: 'income' },
    { date: '12/11', event: 'Assinatura de streaming', category: 'Lazer', amount: 39.9, type: 'expense' },
    { date: '10/11', event: 'Transferência para poupança', category: 'Reserva', amount: 500, type: 'transfer' },
];

export default function UiKit() {
    const { theme, resolvedMode } = useTheme();
    const [preview, setPreview] = useState(resolvedMode);

    // Só pré-visualiza o modo nesta página; nada é salvo. Ao sair, volta ao modo do usuário.
    useLayoutEffect(() => {
        applyAppearance(theme, preview);
    }, [theme, preview]);
    useEffect(() => () => applyAppearance(theme, resolvedMode), [theme, resolvedMode]);

    const [period, setPeriod] = useState('30');
    const [periodSm, setPeriodSm] = useState('7');
    const [notify, setNotify] = useState(true);
    const [autoPay, setAutoPay] = useState(false);
    const [amount, setAmount] = useState(1234.5);
    const [dialog, setDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [replay, setReplay] = useState(0);

    const confirmDelete = () => {
        setDeleting(true);
        setTimeout(() => {
            setDeleting(false);
            setDialog(false);
            toast.success('Transação excluída.');
        }, 1200);
    };

    return (
        <div className="surface-ground min-h-screen">
            <Head title="Kit de interface" />
            <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-6 lg:py-10">
                <PageHeader
                    title="Kit de interface"
                    subtitle="Todos os componentes de Components/ui, com variantes e estados. Página interna, só no ambiente local."
                    actions={
                        <SegmentedControl
                            label="Modo de cor da pré-visualização"
                            options={[
                                { value: 'dark', label: 'Escuro' },
                                { value: 'light', label: 'Claro' },
                            ]}
                            value={preview}
                            onChange={setPreview}
                        />
                    }
                />

                <Section title="Indicadores" note="StatCard: chip com ícone, valor, variação com seta e legenda. Carregando usa Skeleton.">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Saldo em contas" icon={Wallet} value={18420.75} money change="+4,8%" trend="up" caption="vs mês anterior" />
                        <StatCard label="Gastos do mês" icon={ShoppingBag} value={5310.2} money change="+12,1%" trend="up" tone="negative" caption="vs mês anterior" />
                        <StatCard label="Fatura aberta" icon={CreditCard} value={2140} money change="−3,2%" trend="down" tone="positive" caption="vs fatura anterior" />
                        <StatCard label="Contas a vencer" icon={CalendarClock} loading />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Taxa de economia" icon={TrendingUp} value="28,4%" change="estável" trend="flat" caption="média de 3 meses" />
                        <StatCard label="Ícone como elemento" icon={<FinancialIcon type={1} />} value={3} change="2 fonte(s) ativa(s)" trend="none" tone="positive" />
                    </div>
                </Section>

                <Section title="Botões" note="primary, secondary, ghost, danger; sm e md; carregando, desabilitado e só ícone (com aria-label).">
                    <Card>
                        <div className="flex flex-col gap-4">
                            <Row label="md">
                                <Button icon={Plus}>Nova transação</Button>
                                <Button variant="secondary">Exportar</Button>
                                <Button variant="ghost">Cancelar</Button>
                                <Button variant="danger" icon={Trash2}>Excluir</Button>
                            </Row>
                            <Row label="sm">
                                <Button size="sm" icon={Plus}>Nova</Button>
                                <Button size="sm" variant="secondary">Exportar</Button>
                                <Button size="sm" variant="ghost">Cancelar</Button>
                                <Button size="sm" variant="danger">Excluir</Button>
                            </Row>
                            <Row label="Carregando">
                                <Button loading>Salvando…</Button>
                                <Button variant="secondary" loading>Exportando…</Button>
                                <Button size="sm" variant="danger" loading>Excluindo…</Button>
                            </Row>
                            <Row label="Desabilitado">
                                <Button disabled>Salvar</Button>
                                <Button variant="secondary" disabled>Exportar</Button>
                                <Button variant="danger" disabled>Excluir</Button>
                            </Row>
                            <Row label="Só ícone">
                                <Button iconOnly icon={Plus} aria-label="Adicionar" />
                                <Button iconOnly variant="secondary" icon={Pencil} aria-label="Editar" />
                                <Button iconOnly variant="ghost" icon={Pencil} size="sm" aria-label="Editar" />
                                <Button iconOnly variant="danger" icon={Trash2} size="sm" aria-label="Excluir" />
                            </Row>
                        </div>
                    </Card>
                </Section>

                <Section title="Formulário" note="Rótulo visível acima, ajuda e erro ligados por aria-describedby, foco na cor da paleta.">
                    <Card>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <Field label="Descrição" helper="Aparece no extrato e na fatura." required>
                                <Input placeholder="Ex.: Mercado do mês" />
                            </Field>
                            <Field label="Valor">
                                <MoneyInput value={amount} onValueChange={setAmount} />
                            </Field>
                            <Field label="Categoria" error="Escolha uma categoria para salvar.">
                                <Select defaultValue="">
                                    <option value="">Selecione</option>
                                    <option>Alimentação</option>
                                    <option>Transporte</option>
                                </Select>
                            </Field>
                            <Field label="Observação" optional>
                                <Input placeholder="Opcional" />
                            </Field>
                            <Field label="Cartão" helper="Cartão arquivado não recebe compras.">
                                <Input value="Nubank final 4821" disabled readOnly />
                            </Field>
                            <Field label="Valor inválido" error="Informe um valor maior que zero.">
                                <MoneyInput value={0} />
                            </Field>
                            <Field label="Busca (pequeno)">
                                <SearchInput size="sm" placeholder="Buscar transação" />
                            </Field>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[13px] font-medium text-content-secondary">Busca do topo</span>
                                <SearchInput hotkey placeholder="Buscar" />
                                <p className="text-xs text-content-muted">
                                    Atalho <Kbd>Ctrl K</Kbd> foca o campo. Valor digitado acima: <MoneyText value={amount} />
                                </p>
                            </div>
                        </div>
                    </Card>
                </Section>

                <Section title="Controles" note="SegmentedControl (radiogroup, setas trocam) e Switch (role=switch).">
                    <Card>
                        <div className="flex flex-col gap-5">
                            <Row label="Segmentado">
                                <SegmentedControl label="Período" options={PERIODS} value={period} onChange={setPeriod} />
                                <SegmentedControl label="Período (pequeno)" size="sm" options={PERIODS} value={periodSm} onChange={setPeriodSm} />
                            </Row>
                            <div className="grid max-w-xl gap-4">
                                <Switch checked={notify} onChange={setNotify} label="Avisar antes do vencimento" description="Notificação 3 dias antes de cada conta." />
                                <Switch checked={autoPay} onChange={setAutoPay} label="Pagar fatura pela conta principal" />
                                <Switch checked label="Desabilitado (ligado)" disabled />
                            </div>
                        </div>
                    </Card>
                </Section>

                <Section title="Selos" note="O texto diz o estado; a cor só reforça. pill-accent tem contorno para não se passar por alerta.">
                    <Card>
                        <div className="flex flex-col gap-4">
                            <Row label="Tons">
                                <Badge tone="accent">Paleta</Badge>
                                <Badge tone="warning">Aviso</Badge>
                                <Badge tone="danger">Vencido</Badge>
                                <Badge tone="success">Pago</Badge>
                                <Badge tone="info">Info</Badge>
                                <Badge>Neutro</Badge>
                            </Row>
                            <Row label="Prioridade">
                                <PriorityBadge priority="alta" />
                                <PriorityBadge priority="media" />
                                <PriorityBadge priority="baixa" />
                            </Row>
                            <Row label="Classes CSS">
                                <span className="pill pill-accent">.pill-accent</span>
                                <span className="pill pill-warning">.pill-warning</span>
                                <span className="pill pill-danger">.pill-danger</span>
                            </Row>
                        </div>
                    </Card>
                </Section>

                <Section title="Valores" note="MoneyText: receita em verde com +, gasto comum neutro com −, saldo negativo em vermelho.">
                    <Card>
                        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3 text-lg font-semibold">
                            <MoneyText value={6800} type="income" />
                            <MoneyText value={312.4} type="expense" />
                            <MoneyText value={-845.1} tone="auto" />
                            <MoneyText value={1520} sign="always" tone="auto" />
                            <MoneyText value={0} />
                        </div>
                    </Card>
                </Section>

                <Section title="Progresso" note="role=progressbar com valor; passar do limite muda a cor e o texto.">
                    <Card>
                        <div className="grid gap-5 md:grid-cols-3">
                            <ProgressBar label="Alimentação" value={420} max={1000} />
                            <ProgressBar label="Transporte" value={870} max={1000} />
                            <ProgressBar label="Lazer" value={1180} max={1000} />
                        </div>
                    </Card>
                </Section>

                <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                    <Section title="Tabela">
                        <Card
                            title="Atividade recente"
                            subtitle="Lançamentos do período escolhido."
                            actions={<Button size="sm" variant="ghost">Ver tudo</Button>}
                        >
                            <SegmentedControl label="Período da atividade" fullWidth options={PERIODS} value={period} onChange={setPeriod} className="mb-4" />
                            <Table caption="Atividade recente">
                                <THead>
                                    <TRow>
                                        <TH>Data</TH>
                                        <TH>Lançamento</TH>
                                        <TH className="hidden sm:table-cell">Categoria</TH>
                                        <TH align="right">Valor</TH>
                                    </TRow>
                                </THead>
                                <TBody>
                                    {ACTIVITY.map((row) => (
                                        <TRow key={row.event}>
                                            <TCell className="text-content-muted">{row.date}</TCell>
                                            <TCell className="text-content-primary">{row.event}</TCell>
                                            <TCell className="hidden sm:table-cell">{row.category}</TCell>
                                            <TCell align="right">
                                                <MoneyText value={row.amount} type={row.type === 'transfer' ? undefined : row.type} />
                                            </TCell>
                                        </TRow>
                                    ))}
                                </TBody>
                            </Table>
                        </Card>
                    </Section>

                    <Section title="Alertas">
                        <Card title="Alertas do mês" subtitle="O que pede atenção agora.">
                            <div className="flex flex-col gap-3">
                                <AlertItem
                                    priority="alta"
                                    title="Orçamento estourado"
                                    description="Lazer passou do limite de R$ 1.000,00 este mês."
                                    detail="Maior gasto: show no dia 14 (R$ 380,00)."
                                />
                                <AlertItem
                                    priority="media"
                                    title="Fatura fecha em 3 dias"
                                    description="Nubank final 4821 fecha no dia 22."
                                    detail="Compras a partir do dia 22 entram na fatura de dezembro."
                                />
                                <AlertItem priority="baixa" title="Meta de reserva no ritmo" description="Você guardou 62% da meta de novembro." detail="Faltam R$ 380,00 até o fim do mês." />
                            </div>
                        </Card>
                    </Section>
                </div>

                <Section title="Transações" note="TransactionRow: uma linha só, por props.">
                    <Card padding="sm">
                        <div className="flex flex-col">
                            <TransactionRow description="Salário" amount={6800} type="income" meta={['Receita', '15 nov', 'Conta Inter']} status="pago" />
                            <TransactionRow
                                description="Mercado Bom Preço"
                                amount={312.4}
                                type="expense"
                                icon={ShoppingBag}
                                meta={['Alimentação', '18 nov', 'Crédito · 1/1']}
                                actions={<Button iconOnly size="sm" variant="ghost" icon={Pencil} aria-label="Editar Mercado Bom Preço" />}
                            />
                            <TransactionRow description="Conta de luz" amount={184.9} type="expense" icon={ReceiptText} meta={['Moradia', 'vence 25 nov']} status="pendente" />
                            <TransactionRow description="Internet" amount={119.9} type="expense" icon={ReceiptText} meta={['Moradia', 'venceu 10 nov']} status="vencido" />
                            <TransactionRow description="Transferência para poupança" amount={500} type="transfer" icon={ArrowLeftRight} meta={['Reserva', '10 nov']} />
                        </div>
                    </Card>
                </Section>

                <div className="grid gap-6 md:grid-cols-2">
                    <Section title="Vazio">
                        <Card>
                            <EmptyState
                                icon={SearchX}
                                title="Nenhuma transação encontrada"
                                text="Nenhum lançamento bate com a busca. Tente outro termo ou limpe os filtros."
                                action={<Button variant="secondary" size="sm">Limpar filtros</Button>}
                            />
                        </Card>
                    </Section>
                    <Section title="Vazio (invólucro antigo, ícone elemento)">
                        <Card>
                            <LegacyEmptyState
                                icon={<FinancialIcon type={1} className="h-7 w-7" />}
                                title="Nenhum cartão vinculado"
                                description="Adicione um cartão para começar a gerenciar suas faturas e transações."
                            />
                        </Card>
                    </Section>
                    <Section title="Carregando">
                        <Card>
                            <div className="flex flex-col gap-5" aria-busy="true">
                                <span className="sr-only">Carregando</span>
                                <div className="flex items-center gap-3">
                                    <Skeleton shape="circle" className="h-9 w-9" />
                                    <div className="flex-1">
                                        <Skeleton lines={2} />
                                    </div>
                                </div>
                                <Skeleton shape="block" className="h-24 w-full" />
                                <div className="flex items-center gap-3 text-sm text-content-muted">
                                    <Spinner label="Carregando lançamentos" /> Carregando lançamentos
                                    <Spinner size="sm" />
                                    <Spinner size="lg" />
                                </div>
                            </div>
                        </Card>
                    </Section>
                </div>

                <Section title="Diálogo, toasts e entrada" note="ConfirmDialog sobre o Modal comum (foco preso, Esc fecha). Toasts com os tokens. Entrada: 200 ms, cascata em 3 itens.">
                    <Card>
                        <div className="flex flex-col gap-5">
                            <Row label="Diálogo">
                                <Button variant="danger" icon={Trash2} onClick={() => setDialog(true)}>
                                    Excluir transação
                                </Button>
                            </Row>
                            <Row label="Toasts">
                                <Button size="sm" variant="secondary" onClick={() => toast.success('Transação salva.')}>Sucesso</Button>
                                <Button size="sm" variant="secondary" onClick={() => toast.error('Não deu para salvar. Tente de novo.')}>Erro</Button>
                                <Button size="sm" variant="secondary" onClick={() => toast.warning('Fatura fecha em 3 dias.')}>Aviso</Button>
                                <Button size="sm" variant="secondary" onClick={() => toast.info('Sincronizando contas.')}>Info</Button>
                            </Row>
                            <Row label="Entrada">
                                <Button size="sm" variant="secondary" onClick={() => setReplay((n) => n + 1)}>Repetir</Button>
                            </Row>
                            <FadeInContainer key={replay} stagger className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                                {Array.from({ length: 6 }, (_, i) => (
                                    <FadeInItem key={i}>
                                        <div className="rounded-chip border border-line bg-surface-sunken px-3 py-4 text-center text-xs text-content-muted">Item {i + 1}</div>
                                    </FadeInItem>
                                ))}
                            </FadeInContainer>
                        </div>
                    </Card>
                </Section>
            </div>

            <ConfirmDialog
                open={dialog}
                onClose={() => setDialog(false)}
                onConfirm={confirmDelete}
                loading={deleting}
                description={
                    <>
                        Excluir <strong className="font-semibold text-content-primary">Mercado Bom Preço</strong> (<MoneyText value={312.4} />)? Essa ação não pode ser desfeita.
                    </>
                }
            />
        </div>
    );
}
