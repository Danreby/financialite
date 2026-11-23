<?php

namespace Tests\Unit;

use App\Models\Bill;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * Somar meses a partir de 29, 30 ou 31 não pode pular fevereiro.
 */
class MonthOverflowTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function cardWithClosingDay(int $day): CardUser
    {
        return new CardUser(['closing_day' => $day]);
    }

    public function test_purchase_after_closing_on_january_30_goes_to_february(): void
    {
        $transacao = new Transacao;
        $transacao->created_at = Carbon::parse('2027-01-30 14:00:00');
        $transacao->setRelation('bankUser', $this->cardWithClosingDay(10));

        $monthKey = app(FaturaBillingService::class)->resolveBillingMonthKey($transacao);

        $this->assertSame('2027-02', $monthKey);
    }

    public function test_current_billing_month_on_january_31_is_february(): void
    {
        Carbon::setTestNow('2027-01-31 10:00:00');

        $monthKey = app(FaturaBillingService::class)
            ->resolveCurrentBillingMonthKey($this->cardWithClosingDay(10));

        $this->assertSame('2027-02', $monthKey);
    }

    public function test_monthly_bill_after_its_day_on_january_31_is_due_in_february(): void
    {
        Carbon::setTestNow('2027-01-31 10:00:00');

        $bill = new Bill([
            'title' => 'Academia',
            'amount' => 120,
            'recurrence_type' => 'monthly',
            'due_day' => 30,
            'start_date' => '2026-06-01',
            'status' => 'active',
        ]);

        $this->assertSame('2027-02-28', $bill->getNextDueDate()->format('Y-m-d'));
    }
}
