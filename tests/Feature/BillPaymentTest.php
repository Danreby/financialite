<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Transacao;
use App\Models\User;
use App\Services\BillPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillPaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Bill $bill;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->bill = $this->makeBill($this->user, 100.00);
    }

    private function makeBill(User $user, float $amount): Bill
    {
        return Bill::create([
            'title' => 'Internet',
            'amount' => $amount,
            'recurrence_type' => 'monthly',
            'due_day' => 10,
            'start_date' => '2026-01-01',
            'status' => 'active',
            'user_id' => $user->id,
        ]);
    }

    private function pay(float $amount = 100.00): BillPayment
    {
        return app(BillPaymentService::class)->markBillAsPaid($this->bill, $this->user, [
            'due_date' => '2026-11-10',
            'paid_date' => '2026-11-10',
            'amount_paid' => $amount,
        ]);
    }

    public function test_paying_links_payment_to_a_debit_transaction(): void
    {
        $payment = $this->pay(100);

        $this->assertNotNull($payment->transacao_id);
        $this->assertEquals(100.0, (float) Transacao::findOrFail($payment->transacao_id)->amount);
    }

    public function test_paying_the_same_due_date_twice_does_not_duplicate_the_debit(): void
    {
        $this->pay(100);
        $this->pay(80);

        $this->assertSame(1, Transacao::where('user_id', $this->user->id)->count());
        $this->assertEquals(80.0, (float) Transacao::first()->amount);
    }

    public function test_editing_payment_adjusts_the_linked_transaction(): void
    {
        $payment = $this->pay(100);

        $response = $this->actingAs($this->user)->patchJson(
            route('bills.payment.update', [$this->bill, $payment]),
            ['amount_paid' => 60.50]
        );

        $response->assertOk();
        $this->assertEquals(60.5, (float) $payment->fresh()->amount_paid);
        $this->assertEquals(60.5, (float) Transacao::findOrFail($payment->transacao_id)->amount);
    }

    public function test_deleting_payment_reverses_the_linked_transaction(): void
    {
        $payment = $this->pay(100);
        $transacaoId = $payment->transacao_id;

        $this->actingAs($this->user)
            ->deleteJson(route('bills.payment.destroy', [$this->bill, $payment]))
            ->assertOk();

        $this->assertNull(BillPayment::find($payment->id));
        $this->assertNull(Transacao::find($transacaoId));
        $this->assertSame(0, Transacao::where('user_id', $this->user->id)->count());
    }

    public function test_amount_paid_above_bill_amount_is_rejected(): void
    {
        $payment = $this->pay(100);

        $this->actingAs($this->user)->patchJson(
            route('bills.payment.update', [$this->bill, $payment]),
            ['amount_paid' => 100.01]
        )->assertStatus(422)->assertJsonValidationErrors('amount_paid');

        $this->assertEquals(100.0, (float) $payment->fresh()->amount_paid);
    }

    public function test_amount_paid_must_be_positive(): void
    {
        $payment = $this->pay(100);

        $this->actingAs($this->user)->patchJson(
            route('bills.payment.update', [$this->bill, $payment]),
            ['amount_paid' => 0]
        )->assertStatus(422)->assertJsonValidationErrors('amount_paid');
    }

    public function test_cannot_edit_or_delete_another_users_payment(): void
    {
        $payment = $this->pay(100);
        $other = User::factory()->create();

        $this->actingAs($other)->patchJson(
            route('bills.payment.update', [$this->bill, $payment]),
            ['amount_paid' => 50]
        )->assertForbidden();

        $this->actingAs($other)
            ->deleteJson(route('bills.payment.destroy', [$this->bill, $payment]))
            ->assertForbidden();

        $this->assertNotNull(BillPayment::find($payment->id));
    }

    public function test_payment_of_another_bill_returns_404(): void
    {
        $payment = $this->pay(100);
        $otherBill = $this->makeBill($this->user, 100);

        $this->actingAs($this->user)->patchJson(
            route('bills.payment.update', [$otherBill, $payment]),
            ['amount_paid' => 50]
        )->assertNotFound();
    }

    public function test_mark_as_paid_rejects_amount_above_bill_amount(): void
    {
        $this->actingAs($this->user)->postJson(
            route('bills.pay', $this->bill),
            ['due_date' => '2026-11-10', 'amount_paid' => 100.01]
        )->assertStatus(422)->assertJsonValidationErrors('amount_paid');

        $this->assertSame(0, BillPayment::count());
    }

    public function test_api_pay_route_records_payment_through_the_service(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->user);

        $this->postJson("/api/v1/bills/{$this->bill->id}/pay", [
            'due_date' => '2026-11-10',
            'amount_paid' => 100,
        ])->assertOk();

        $this->assertSame(1, BillPayment::where('bill_id', $this->bill->id)->count());
        $this->assertSame(1, Transacao::where('user_id', $this->user->id)->count());
    }
}
