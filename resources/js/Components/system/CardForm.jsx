import { useEffect, useState } from "react";
import { Calendar, CreditCard } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "../common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
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
				toast.error("NÃ£o foi possÃ­vel carregar os cartÃµes.");
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
			toast.error("Selecione um cartÃ£o.");
			setIsSubmitting(false);
			return;
		}

		if (!dueDay || dueDay.trim() === "") {
			toast.error("O dia de vencimento Ã© obrigatÃ³rio.");
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

		if (!closingDay || closingDay.trim() === "") {
			toast.error("O dia de fechamento Ã© obrigatÃ³rio.");
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
				toast.error("O limite de crÃ©dito deve possuir no mÃ¡ximo 10 dÃ­gitos.");
				document.getElementById("credit_limit")?.focus();
				setIsSubmitting(false);
				return;
			}
		}

		if (description && description.trim().length > 255) {
			toast.error("A descriÃ§Ã£o deve ter no mÃ¡ximo 255 caracteres.");
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
					toast.info(payload.message || "Este cartÃ£o jÃ¡ estÃ¡ vinculado ao usuÃ¡rio.");
				} else {
					toast.success("CartÃ£o vinculado com sucesso.");
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
						"Erro de validaÃ§Ã£o ao vincular cartÃ£o.";
					toast.error(firstError);
					return;
				}
				toast.error("Erro ao vincular cartÃ£o.");
			});
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Adicionar CartÃ£o">
			<form className="space-y-5" onSubmit={handleSubmit} noValidate>

				{/* CartÃ£o */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
						<CreditCard className="inline w-4 h-4 mr-1.5 mb-0.5 text-gray-400" />
						CartÃ£o <span className="text-red-500">*</span>
					</label>
					<Autocomplete
						options={cards}
						value={selectedCardId}
						onChange={setSelectedCardId}
						placeholder="Pesquisar cartÃ£o..."
						labelKey="label"
						valueKey="value"
						name="card_id"
					/>
				</div>

				{/* Dias de vencimento e fechamento */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label htmlFor="due_day" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
							Vencimento <span className="text-red-500">*</span>
						</label>
						<div className="relative">
							<span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
								<Calendar className="w-4 h-4 text-gray-400" />
							</span>
							<input
								id="due_day"
								type="text"
								value={dueDay}
								onChange={handleDayChange(setDueDay)}
								onKeyDown={handleNumericKeyDown}
								maxLength={2}
								inputMode="numeric"
								pattern="\\d{1,2}"
								placeholder="Ex: 10"
								className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
							/>
						</div>
						<p className="mt-1 text-xs text-gray-400">Dia 1 a 31</p>
					</div>
					<div>
						<label htmlFor="closing_day" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
							Fechamento <span className="text-red-500">*</span>
						</label>
						<div className="relative">
							<span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
								<Calendar className="w-4 h-4 text-gray-400" />
							</span>
							<input
								id="closing_day"
								type="text"
								value={closingDay}
								onChange={handleDayChange(setClosingDay)}
								onKeyDown={handleNumericKeyDown}
								maxLength={2}
								inputMode="numeric"
								pattern="\\d{1,2}"
								placeholder="Ex: 3"
								className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
							/>
						</div>
						<p className="mt-1 text-xs text-gray-400">Dia 1 a 31</p>
					</div>
				</div>

				{/* Bandeira */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
						Bandeira
					</label>
					<Autocomplete
						options={BRAND_OPTIONS}
						value={brand}
						onChange={setBrand}
						placeholder="Bandeira do cartÃ£o..."
						labelKey="label"
						valueKey="value"
						name="brand"
					/>
				</div>

				{/* Limite de crÃ©dito */}
				<div>
					<label htmlFor="credit_limit" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
						Limite de crÃ©dito <span className="text-xs font-normal text-gray-400">(opcional)</span>
					</label>
					<div className="relative">
						<span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-sm font-semibold text-gray-500 dark:text-gray-400">
							R$
						</span>
						<input
							id="credit_limit"
							type="text"
							value={creditLimit}
							onChange={handleCreditLimitChange}
							onKeyDown={handleNumericKeyDown}
							inputMode="decimal"
							placeholder="0.00"
							className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-3 py-2.5 text-sm shadow-sm themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
						/>
					</div>
				</div>

				{/* ObservaÃ§Ãµes */}
				<div>
					<label htmlFor="card_description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
						ObservaÃ§Ãµes <span className="text-xs font-normal text-gray-400">(opcional)</span>
					</label>
					<textarea
						id="card_description"
						name="card_description"
						value={description}
						onChange={(e) => setDescription(e.target.value.slice(0, 255))}
						placeholder="Notas sobre este cartÃ£o..."
						maxLength={255}
						rows={2}
						className="w-full rounded-xl border border-gray-300 bg-white p-2.5 text-sm shadow-sm resize-none themed-focus dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
					/>
				</div>

				<div className="flex items-center justify-end gap-3 pt-1">
					<SecondaryButton type="button" onClick={onClose}>
						Cancelar
					</SecondaryButton>
					<PrimaryButton type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Salvando..." : "Vincular CartÃ£o"}
					</PrimaryButton>
				</div>
			</form>
		</Modal>
	);
}
