import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Modal from "../common/Modal";
import PrimaryButton from "@/Components/common/buttons/PrimaryButton";
import SecondaryButton from "@/Components/common/buttons/SecondaryButton";
import FloatLabelField from "@/Components/common/inputs/FloatLabelField";
import Autocomplete from "@/Components/common/inputs/Autocomplete";
import { useNumericInput } from "@/Hooks/useNumericInput";

export default function CardForm({ isOpen, onClose, onSuccess }) {
	const [cards, setCards] = useState([]);
	const [selectedCardId, setSelectedCardId] = useState("");
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
		}
	}, [isOpen]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (isSubmitting) return;
		setIsSubmitting(true);

		const formData = new FormData(e.currentTarget);
		const dueDayRaw = formData.get("due_day")?.toString().trim();
		const formElement = e.currentTarget;

		toast.dismiss();

		if (!selectedCardId) {
			toast.error("Selecione um cartão.");
			setIsSubmitting(false);
			return;
		}

		let dueDay = null;
		if (dueDayRaw) {
			const parsed = parseInt(dueDayRaw, 10);
			if (Number.isNaN(parsed) || parsed < 1 || parsed > 31) {
				toast.error("Informe um dia de vencimento entre 1 e 31.");
				formElement.elements.namedItem("due_day")?.focus();
				setIsSubmitting(false);
				return;
			}
			dueDay = parsed;
		}

		axios
			.post(route("cards.attach"), { card_id: selectedCardId, due_day: dueDay })
			.then((response) => {
				toast.dismiss();
				const payload = response.data || {};
				if (payload.already_attached) {
					toast.info(payload.message || "Este cartão já está vinculado ao usuário.");
				} else {
					toast.success("Cartão vinculado com sucesso.");
				}
				formElement.reset();
				setSelectedCardId("");
				setIsSubmitting(false);
				if (onSuccess) onSuccess(payload.card_user || payload);
				if (onClose) onClose();
			})
			.catch((error) => {
				toast.dismiss();
				setIsSubmitting(false);
				if (error.response && error.response.status === 422) {
					const data = error.response.data || {};
					const validationMessage =
						data.errors?.card_id?.[0] || data.message || "Erro de validação ao vincular cartão.";
					toast.error(validationMessage);
					return;
				}
				toast.error("Erro ao vincular cartão.");
			});
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="Adicionar cartão">
			<form className="space-y-4" onSubmit={handleSubmit} noValidate>
				<div className="flex flex-col gap-1">
					<label className="text-sm font-medium text-gray-700 dark:text-gray-200">
						Cartão
					</label>
					<Autocomplete
						options={cards}
						value={selectedCardId}
						onChange={setSelectedCardId}
						placeholder="Pesquisar cartão..."
						labelKey="label"
						valueKey="value"
						name="card_id"
					/>
				</div>

				<FloatLabelField
					id="due_day"
					name="due_day"
					type="number"
					label="Dia de vencimento do cartão (1 a 31)"
					inputProps={{
						min: 1,
						max: 31,
						inputMode: "numeric",
						onKeyDown: handleNumericKeyDown,
						placeholder: "Opcional. Ex: 10",
					}}
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
