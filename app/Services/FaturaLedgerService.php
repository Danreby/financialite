<?php

namespace App\Services;

use App\Models\BankLedgerEntry;
use App\Models\Fatura;
use App\Models\FaturaPaymentEvent;
use App\Models\Transacao;
use Illuminate\Support\Facades\DB;

class FaturaLedgerService
{
    /**
     * Appends an immutable payment/reversal event for a fatura and recomputes its
     * cached total_paid from the event log. This is the ONLY place allowed to write
     * Fatura::total_paid.
     */
    public function recordPaymentEvent(
        Fatura $fatura,
        float $amount,
        string $type,
        ?Transacao $transacao = null,
        ?BankLedgerEntry $bankLedgerEntry = null,
        ?string $description = null
    ): FaturaPaymentEvent {
        return DB::transaction(function () use ($fatura, $amount, $type, $transacao, $bankLedgerEntry, $description) {
            $event = FaturaPaymentEvent::create([
                'fatura_id' => $fatura->id,
                'transacao_id' => $transacao?->id,
                'bank_ledger_entry_id' => $bankLedgerEntry?->id,
                'type' => $type,
                'amount' => round($amount, 2),
                'description' => $description,
                'created_at' => now(),
            ]);

            $fatura->total_paid = $this->totalPaid($fatura->id);
            $fatura->save();

            return $event;
        });
    }

    public function totalPaid(int $faturaId): float
    {
        $payments = (float) FaturaPaymentEvent::forFatura($faturaId)
            ->where('type', FaturaPaymentEvent::TYPE_PAYMENT)
            ->sum('amount');

        $reversals = (float) FaturaPaymentEvent::forFatura($faturaId)
            ->where('type', FaturaPaymentEvent::TYPE_REVERSAL)
            ->sum('amount');

        return round(max(0.0, $payments - $reversals), 2);
    }
}
