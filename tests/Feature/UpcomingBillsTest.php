<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\User;
use App\Services\DashboardInsightsService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpcomingBillsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_bill_due_next_month_is_listed_on_the_last_day_of_january(): void
    {
        // Em 31/01, addMonth() transbordaria para março e pularia fevereiro.
        Carbon::setTestNow('2027-01-31 10:00:00');
        $user = User::factory()->create();

        Bill::create([
            'title' => 'IPVA',
            'amount' => 850,
            'recurrence_type' => 'yearly',
            'due_day' => 10,
            'start_date' => '2026-02-10',
            'status' => 'active',
            'user_id' => $user->id,
        ]);

        $bills = app(DashboardInsightsService::class)->getInsights($user)['upcoming_bills'];

        $this->assertCount(1, $bills);
        $this->assertSame('IPVA', $bills[0]['title']);
        $this->assertSame('2027-02-10', $bills[0]['due_date']);
    }
}
