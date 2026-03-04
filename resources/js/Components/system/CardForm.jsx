import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "../common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import FloatLabelField from "@/Components/common/inputs/FloatLabelField";
import Autocomplete from "@/Components/common/inputs/Autocomplete";
import { useNumericInput } from "@/Hooks/useNumericInput";

const BRAND_OPTIONS = [
	{ value: '', label: 'Sem bandeira' },
	{ value: 'visa', label: 'Visa' },
	{ value: 'mastercard', label: 'Mastercard' },
	{ value: 'elo', label: 'Elo' },
	{ value: 'hipercard', label: 'Hipercard' },
	{ value: 'american_express', label: 'American Express' },
	{ value: 'diners_club', label: 'Diners Club' },
	{ value: 'aura', label: 'Aura' },
	{ value: 'cabal', label: 'Cabal' },
	{ value: 'sorocred', label: 'Sorocred' },
	{ value: 'banescard', label: 'Banescard' },
	{ value: 'banricompras', label: 'BanriCompras' },
	{ value: 'jcb', label: 'JCB' },
	{ value: 'unionpay', label: 'UnionPay' },
];

export default function CardForm({ isOpen, onClose, onSuccess }) {
	const [cards, setCards] = useState([]);
	const [selectedCardId, setSelectedCardId] = useState("");
	const [brand, setBrand] = useState("");
	const [description, setDescription] = useState("");
	const [dueDay, setDueDay] = useState("");
	const [closingDay, setClosingDay] = useState("");
	const [creditLimit, setCreditLimit] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleNumericKeyDown = useNumericInput();

	useEffect(() => {
		if (!isOpen) return;

		let cancelled = false;

		const loadCards = async () => {
			try {
				const response = await axios.get(route("cards.list"));
				if (!cancelled) {
					setCards(
						(response.data || []).map((c) => ({
							value: String(c.id),
							label: c.name,
						}))
					);
				}
			} catch (error) {
				console.error(error);
				toast.error("Não foi possível carregar os cartões.");
			}
		};

		loadCards();

		return () => {
			cancelled = true;
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) {
			setSelectedCardId("");
			setBrand("");
			setDescription("");
			setDueDay("");
			setClosingDay("");
			setCreditLimit("");
		}
	}, [isOpen]);

	const handleDayChange = (setter) => (e) => {
		let v = e.target.value.replace(/\D/g, "").slice(0, 2);
		if (v !== "") {
			let n = parseInt(v, 10);
			if (Number.isNaN(n)) {
				v = "";
			} else {
				if (n > 31) n = 31;
				if (n < 1) n = 1;
				v = String(n);
			}
		}
		setter(v);
	};

	const handleCreditLimitChange = (e) => {
		let v = e.target.value;
		v = v.replace(/[^0-9.]/g, "");
		const parts = v.split(".");
		const intPart = (parts[0] || "").slice(0, 10); 
		let fracPart = parts[1] ?? "";
		if (parts.length > 2) {
			fracPart = parts.slice(1).join("").slice(0, 2);
		} else {
			fracPart = fracPart.slice(0, 2);
		}
		const final = fracPart !== "" ? `${intPart}.${fracPart}` : intPart;
		setCreditLimit(final);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (isSubmitting) return;
		setIsSubmitting(true);

		toast.dismiss();

		if (!selectedCardId) {
			toast.error("Selecione um cartão.");
			setIsSubmitting(false);
			return;
		}

		// Dia de vencimento é obrigatório
		if (!dueDay || dueDay.trim() === "") {
			toast.error("O dia de vencimento é obrigatório.");
			document.getElementById("due_day")?.focus();
			setIsSubmitting(false);
			return;
		}
		const dueDayParsed = parseInt(dueDay, 10);
		if (Number.isNaN(dueDayParsed) || dueDayParsed < 1 || dueDayParsed > 31) {
			toast.error("Informe um dia de vencimento entre 1 e 31.");
			document.getElementById("due_day")?.focus();
			setIsSubmitting(false);
			return;
		}

		// Dia de fechamento é obrigatório
		if (!closingDay || closingDay.trim() === "") {
			toast.error("O dia de fechamento é obrigatório.");
			document.getElementById("closing_day")?.focus();
			setIsSubmitting(false);
			return;
		}
		const closingDayParsed = parseInt(closingDay, 10);
		if (Number.isNaN(closingDayParsed) || closingDayParsed < 1 || closingDayParsed > 31) {
			toast.error("Informe um dia de fechamento entre 1 e 31.");
			document.getElementById("closing_day")?.focus();
			setIsSubmitting(false);
			return;
		}

		if (creditLimit) {
			const cleaned = creditLimit.replace(/[^0-9]/g, ""); 
			if (cleaned.length > 10) {
				toast.error("O limite de crédito deve possuir no máximo 10 dígitos.");
				document.getElementById("credit_limit")?.focus();
				setIsSubmitting(false);
				return;
			}
		}

		if (description && description.trim().length > 255) {
			toast.error("A descrição deve ter no máximo 255 caracteres.");
			document.getElementById("card_description")?.focus();
			setIsSubmitting(false);
			return;
		}

		axios
			.post(route("cards.attach"), {
				card_id: selectedCardId,
				due_day: dueDayParsed,
				brand: brand || null,
				description: description.trim() || null,
				closing_day: closingDayParsed,
				credit_limit: creditLimit ? parseFloat(creditLimit) : null,
			})
			.then((response) => {
				toast.dismiss();
				const payload = response.data || {};
				if (payload.already_attached) {
					toast.info(payload.message || "Este cartão já está vinculado ao usuário.");
				} else {
					toast.success("Cartão vinculado com sucesso.");
				}
				setSelectedCardId("");
				setBrand("");
				setDescription("");
				setDueDay("");
				setClosingDay("");
				setCreditLimit("");
				setIsSubmitting(false);
				if (onSuccess) onSuccess(payload.card_user || payload);
				if (onClose) onClose();
			})
			.catch((error) => {
				toast.dismiss();
				setIsSubmitting(false);
				if (error.response && error.response.status === 422) {
					const data = error.response.data || {};
					const errors = data.errors ?? {};
					const firstError =
						errors.due_day?.[0] ||
						errors.closing_day?.[0] ||
						errors.card_id?.[0] ||
						data.message ||
						"Erro de validação ao vincular cartão.";
					toast.error(firstError);
					return;
				}
				toast.error("Erro ao vincular cartão.");
			});
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Adicionar cartão">
			<form className="space-y-4" onSubmit={handleSubmit} noValidate>

				<Autocomplete
					options={cards}
					value={selectedCardId}
					onChange={setSelectedCardId}
					placeholder="Pesquisar cartão..."
					labelKey="label"
					valueKey="value"
					name="card_id"
				/>

				<FloatLabelField
					id="due_day"
					name="due_day"
					type="text"
					label="Dia de vencimento (1 a 31) *"
					inputProps={{
						maxLength: 2,
						inputMode: "numeric",
						pattern: "\\d{1,2}",
						onKeyDown: handleNumericKeyDown,
						placeholder: "Obrigatório. Ex: 10",
						value: dueDay,
						onChange: handleDayChange(setDueDay),
						required: true,
					}}
				/>

				<FloatLabelField
					id="closing_day"
					name="closing_day"
					type="text"
					label="Dia de fechamento (1 a 31) *"
					inputProps={{
						maxLength: 2,
						inputMode: "numeric",
						pattern: "\\d{1,2}",
						onKeyDown: handleNumericKeyDown,
						placeholder: "Obrigatório. Ex: 3",
						value: closingDay,
						onChange: handleDayChange(setClosingDay),
						required: true,
					}}
				/>

				<Autocomplete
					options={BRAND_OPTIONS}
					value={brand}
					onChange={setBrand}
					placeholder="Bandeira do cartão..."
					labelKey="label"
					valueKey="value"
					name="brand"
				/>

				<FloatLabelField
					id="credit_limit"
					name="credit_limit"
					type="text"
					label="Limite de crédito (R$)"
					inputProps={{
						placeholder: "Opcional. Ex: 5000.00",
						inputMode: "decimal",
						onKeyDown: handleNumericKeyDown,
						value: creditLimit,
						onChange: handleCreditLimitChange,
					}}
				/>

				<textarea
					id="card_description"
					name="card_description"
					value={description}
					onChange={(e) => setDescription(e.target.value.slice(0, 255))}
					placeholder="Observações sobre este cartão..."
					maxLength={255}
					rows={2}
					className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm shadow-sm resize-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
				/>

				<div className="flex items-center justify-end gap-3 pt-2">
					<SecondaryButton
						type="button"
						onClick={onClose}
						className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						Cancelar
					</SecondaryButton>
					<PrimaryButton type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Salvando..." : "Salvar"}
					</PrimaryButton>
				</div>
			</form>
		</Modal>
	);
}