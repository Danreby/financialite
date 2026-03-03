import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Head } from '@inertiajs/react';
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/common/buttons/PrimaryButton';
import Pagination from '@/Components/common/Pagination';
import ScrollArea from '@/Components/common/ScrollArea';
import EmptyState from '@/Components/common/EmptyState';
import ConfirmDeleteModal from '@/Components/common/ConfirmDeleteModal';
import CardForm from '@/Components/system/CardForm';
import CardItem from '@/Components/system/cartoes/CardItem';
import EditCardModal from '@/Components/system/cartoes/EditCardModal';
import FadeInContainer, { FadeInItem } from '@/Components/common/FadeInContainer';

import FinancialIcon from '@/Components/common/icons/FinancialIcon';

const ICONS = {
  plus: 1,      
  creditCard: 1,  
  calendar: 5,    
  clock: 6,      
  user: 5,    
};

export default function Cartoes({ bankAccounts }) {
  const initialCards = useMemo(() => {
    if (Array.isArray(bankAccounts?.data)) return bankAccounts.data;
    if (Array.isArray(bankAccounts)) return bankAccounts;
    return [];
  }, [bankAccounts]);

  const [localCards, setLocalCards] = useState(initialCards);
  const [saving, setSaving] = useState(false);
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [cardBeingEdited, setCardBeingEdited] = useState(null);
  const [cardDueDayInput, setCardDueDayInput] = useState('');
  const [cardBrandInput, setCardBrandInput] = useState('');
  const [cardDescriptionInput, setCardDescriptionInput] = useState('');
  const [cardClosingDayInput, setCardClosingDayInput] = useState('');
  const [cardCreditLimitInput, setCardCreditLimitInput] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState({ type: null, id: null, name: '' });

  useEffect(() => {
    const next = Array.isArray(bankAccounts?.data)
      ? bankAccounts.data
      : Array.isArray(bankAccounts)
      ? bankAccounts
      : [];
    setLocalCards(next);
  }, [bankAccounts]);

  const openEditCardModal = (account) => {
    setCardBeingEdited(account);
    setCardDueDayInput(account.due_day ? String(account.due_day) : '');
    setCardBrandInput(account.brand || '');
    setCardDescriptionInput(account.description || '');
    setCardClosingDayInput(account.closing_day ? String(account.closing_day) : '');
    setCardCreditLimitInput(account.credit_limit != null ? String(account.credit_limit) : '');
    setIsEditCardModalOpen(true);
  };

  const handleSubmitEditCard = async (event) => {
    event.preventDefault();
    if (!cardBeingEdited || saving) return;

    const dueValue = cardDueDayInput.trim();
    const parsedDue = dueValue ? parseInt(dueValue, 10) : null;
    if (dueValue && (Number.isNaN(parsedDue) || parsedDue < 1 || parsedDue > 31)) {
      toast.error('Informe um dia de vencimento entre 1 e 31.');
      return;
    }

    const closingValue = cardClosingDayInput.trim();
    const parsedClosing = closingValue ? parseInt(closingValue, 10) : null;
    if (closingValue && (Number.isNaN(parsedClosing) || parsedClosing < 1 || parsedClosing > 31)) {
      toast.error('Informe um dia de fechamento entre 1 e 31.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        due_day: parsedDue,
        closing_day: parsedClosing,
        brand: cardBrandInput || null,
        description: cardDescriptionInput.trim() || null,
        credit_limit: cardCreditLimitInput ? parseFloat(cardCreditLimitInput) : null,
      };

      const response = await axios.patch(route('cards.update-due-day', cardBeingEdited.id), payload);
      const updated = response.data || {};
      setLocalCards((prev) =>
        prev.map((acc) =>
          acc.id === cardBeingEdited.id
            ? { ...acc, ...updated }
            : acc,
        ),
      );
      toast.success('Cartão atualizado com sucesso.');
      setIsEditCardModalOpen(false);
      setCardBeingEdited(null);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível atualizar o cartão.');
    } finally {
      setSaving(false);
    }
  };

  const openConfirmDelete = (type, payload) => {
    if (type === 'card') {
      setConfirmTarget({ type: 'card', id: payload.bankId, name: payload.name });
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget.type || !confirmTarget.id) {
      setIsConfirmModalOpen(false);
      return;
    }
    setSaving(true);
    try {
      await axios.delete(route('cards.destroy', confirmTarget.id));
      setLocalCards((prev) => prev.filter((acc) => acc.card_id !== confirmTarget.id));
      toast.success('Cartão removido com sucesso.');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível remover o cartão.');
    } finally {
      setSaving(false);
      setIsConfirmModalOpen(false);
      setConfirmTarget({ type: null, id: null, name: '' });
    }
  };

  const handleCancelConfirmModal = useCallback(() => {
    if (saving) return;
    setIsConfirmModalOpen(false);
    setConfirmTarget({ type: null, id: null, name: '' });
  }, [saving]);

  const handleCardFormSuccess = (cardUser) => {
    if (!cardUser || !cardUser.id) return;
    const name = cardUser.card?.name || `Cartão #${cardUser.id}`;
    setLocalCards((prev) => {
      if (prev.some((acc) => acc.id === cardUser.id)) return prev;
      return [...prev, {
        id: cardUser.id,
        card_id: cardUser.card_id,
        name,
        due_day: cardUser.due_day,
        closing_day: cardUser.closing_day,
        credit_limit: cardUser.credit_limit,
        brand: cardUser.card?.brand || cardUser.brand,
        description: cardUser.card?.description || cardUser.description,
      }];
    });
  };

  const handleCloseEditCard = useCallback(() => {
    if (saving) return;
    setIsEditCardModalOpen(false);
    setCardBeingEdited(null);
  }, [saving]);

  const cardsWithDueDay = localCards.filter((c) => c.due_day);
  const cardsWithoutDueDay = localCards.filter((c) => !c.due_day);

  return (
    <AuthenticatedLayout>
      <Head title="Cartões" />
      <FadeInContainer className="w-full max-w-[1450px] 2xl:max-w-[1500px] mx-auto px-3 py-2 space-y-4 sm:px-4 sm:py-3 lg:px-5 lg:py-4">
        <FadeInItem type="fast">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Cartões</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Gerencie os cartões vinculados à sua conta.
              </p>
            </div>
            <PrimaryButton
              type="button"
              onClick={() => setIsCardFormOpen(true)}
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-medium self-start sm:self-auto flex items-center"
            >
              <FinancialIcon type={ICONS.plus} className="mr-1.5 h-4 w-4" />
              Novo Cartão
            </PrimaryButton>
          </header>
        </FadeInItem>

        <FadeInItem type="subtle">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatMini label="Total de cartões" value={localCards.length} icon={ICONS.creditCard} />
            <StatMini label="Com vencimento" value={cardsWithDueDay.length} icon={ICONS.calendar} />
            <StatMini label="Sem vencimento" value={cardsWithoutDueDay.length} icon={ICONS.clock} />
          </div>
        </FadeInItem>

        <FadeInItem type="subtle">
          <section className="rounded-2xl p-4 sm:p-5 shadow-md themed-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0">
                  <FinancialIcon type={ICONS.creditCard} className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Cartões Vinculados</h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {localCards.length} {localCards.length === 1 ? 'cartão' : 'cartões'} cadastrados
                  </p>
                </div>
              </div>
              {saving && (
                <span className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">Salvando...</span>
              )}
            </div>

            {localCards.length > 0 ? (
              <ScrollArea maxHeightClassName="max-h-[460px] sm:max-h-[520px]" className="pr-1 space-y-2">
                <AnimatePresence mode="popLayout">
                  {localCards.map((account) => (
                    <CardItem
                      key={account.id}
                      account={account}
                      onEdit={openEditCardModal}
                      onDelete={(payload) => openConfirmDelete('card', payload)}
                      saving={saving}
                    />
                  ))}
                </AnimatePresence>
              </ScrollArea>
            ) : (
              <EmptyState
                icon={<FinancialIcon type={ICONS.creditCard} className="h-7 w-7" />}
                title="Nenhum cartão vinculado"
                description="Adicione um cartão para começar a gerenciar suas faturas e transações."
              />
            )}
            {bankAccounts?.links && <Pagination links={bankAccounts.links} className="mt-3" />}
          </section>
        </FadeInItem>

        {cardsWithDueDay.length > 0 && (
          <FadeInItem type="subtle">
            <div className="rounded-2xl p-4 sm:p-5 shadow-md themed-card">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Calendário de vencimentos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {[...cardsWithDueDay]
                  .sort((a, b) => (a.due_day || 99) - (b.due_day || 99))
                  .map((card) => (
                    <DueDateBadge key={card.id} card={card} />
                  ))}
              </div>
            </div>
          </FadeInItem>
        )}
      </FadeInContainer>

      <CardForm isOpen={isCardFormOpen} onClose={() => setIsCardFormOpen(false)} onSuccess={handleCardFormSuccess} />
      <EditCardModal
        isOpen={isEditCardModalOpen}
        onClose={handleCloseEditCard}
        card={cardBeingEdited}
        dueDayInput={cardDueDayInput}
        onDueDayChange={setCardDueDayInput}
        brandInput={cardBrandInput}
        onBrandChange={setCardBrandInput}
        descriptionInput={cardDescriptionInput}
        onDescriptionChange={setCardDescriptionInput}
        closingDayInput={cardClosingDayInput}
        onClosingDayChange={setCardClosingDayInput}
        creditLimitInput={cardCreditLimitInput}
        onCreditLimitChange={setCardCreditLimitInput}
        onSubmit={handleSubmitEditCard}
        saving={saving}
      />
      <ConfirmDeleteModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelConfirmModal}
        target={confirmTarget}
        onConfirm={handleConfirmDelete}
        saving={saving}
      />
    </AuthenticatedLayout>
  );
}

function StatMini({ label, value, icon }) {
  const isTypeNumber = typeof icon === 'number';
  return (
    <div className="rounded-2xl p-3 sm:p-4 shadow-md themed-card flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-theme-accent/10 dark:bg-theme-accent/20 flex-shrink-0">
        <span className="text-lg">
          {isTypeNumber ? <FinancialIcon type={icon} className="h-5 w-5" /> : icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

function DueDateBadge({ card }) {
  const today = new Date().getDate();
  const dueDay = card.due_day || 0;
  const daysUntil = dueDay >= today ? dueDay - today : dueDay + 30 - today;
  const urgencyClass =
    daysUntil === 0
      ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500'
      : daysUntil <= 3
      ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500'
      : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700';
  const dayLabel = daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `${daysUntil}d`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border p-3 text-center ${urgencyClass}`}
    >
      <div className="flex items-center justify-center gap-2">
        <FinancialIcon type={ICONS.calendar} className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" title={card.name}>
          {card.name}
        </p>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">dia {dueDay}</p>
      <p className={`text-[10px] font-medium mt-0.5 ${daysUntil <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {dayLabel}
      </p>
    </motion.div>
  );
}