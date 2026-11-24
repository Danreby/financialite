<?php

namespace Tests\Unit;

use App\Support\Money;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class MoneyTest extends TestCase
{
    public function test_split_100_in_3_sums_exactly(): void
    {
        $parts = Money::split(10000, 3);

        $this->assertSame([3334, 3333, 3333], $parts);
        $this->assertSame(10000, array_sum($parts));
    }

    public function test_split_puts_remainder_on_first_parts(): void
    {
        $this->assertSame([2, 2, 1, 1], Money::split(6, 4));
        $this->assertSame([1, 1, 0], Money::split(2, 3));
        $this->assertSame([500], Money::split(500, 1));
        $this->assertSame([0, 0], Money::split(0, 2));
    }

    public function test_split_negative_mirrors_positive(): void
    {
        $parts = Money::split(-10000, 3);

        $this->assertSame([-3334, -3333, -3333], $parts);
        $this->assertSame(-10000, array_sum($parts));
    }

    public function test_split_rejects_zero_parts(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Money::split(100, 0);
    }

    public function test_from_decimal_reads_strings_exactly(): void
    {
        $this->assertSame(12345, Money::fromDecimal('123.45'));
        $this->assertSame(12340, Money::fromDecimal('123.4'));
        $this->assertSame(12300, Money::fromDecimal('123'));
        $this->assertSame(12300, Money::fromDecimal('123.'));
        $this->assertSame(50, Money::fromDecimal('.5'));
        $this->assertSame(1, Money::fromDecimal('0.01'));
        $this->assertSame(0, Money::fromDecimal('0.00'));
        $this->assertSame(12345, Money::fromDecimal(' +123.45 '));
        $this->assertSame(7, Money::fromDecimal('0000.07'));
    }

    public function test_from_decimal_accepts_int_as_reais(): void
    {
        $this->assertSame(5000, Money::fromDecimal(50));
        $this->assertSame(-1000, Money::fromDecimal(-10));
        $this->assertSame(0, Money::fromDecimal(0));
    }

    public function test_from_decimal_converts_floats_through_two_decimals(): void
    {
        $this->assertSame(2020, Money::fromDecimal(20.20));
        $this->assertSame(10, Money::fromDecimal(0.10));
        $this->assertSame(30, Money::fromDecimal(0.1 + 0.2));
        $this->assertSame(10001, Money::fromDecimal(100.01));
        $this->assertSame(-1999, Money::fromDecimal(-19.99));
    }

    public function test_from_decimal_rounds_half_up_away_from_zero(): void
    {
        $this->assertSame(1, Money::fromDecimal('0.005'));
        $this->assertSame(0, Money::fromDecimal('0.004'));
        $this->assertSame(0, Money::fromDecimal('0.0049999'));
        $this->assertSame(101, Money::fromDecimal('1.005'));
        $this->assertSame(100, Money::fromDecimal('0.995'));
        $this->assertSame(-1, Money::fromDecimal('-0.005'));
        $this->assertSame(-101, Money::fromDecimal('-1.005'));
        $this->assertSame(100, Money::fromDecimal('0.9999'));
    }

    public function test_from_decimal_handles_negative_values(): void
    {
        $this->assertSame(-12345, Money::fromDecimal('-123.45'));
        $this->assertSame(-5, Money::fromDecimal('-0.05'));
    }

    public function test_from_decimal_handles_large_values(): void
    {
        // Maior valor de decimal(15,2).
        $this->assertSame(999999999999999, Money::fromDecimal('9999999999999.99'));
        $this->assertSame(-999999999999999, Money::fromDecimal('-9999999999999.99'));
        $this->assertSame('9999999999999.99', Money::toDecimal(999999999999999));
    }

    public function test_from_decimal_accepts_scientific_notation(): void
    {
        $this->assertSame(100000, Money::fromDecimal('1e3'));
    }

    public function test_from_decimal_rejects_garbage(): void
    {
        foreach (['', 'abc', '1,50', '1.2.3', '-', '.', '12a'] as $invalid) {
            try {
                Money::fromDecimal($invalid);
                $this->fail("Deveria rejeitar \"{$invalid}\".");
            } catch (InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function test_from_decimal_rejects_values_that_would_overflow(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Money::fromDecimal('12345678901234567890.00');
    }

    public function test_to_decimal(): void
    {
        $this->assertSame('123.45', Money::toDecimal(12345));
        $this->assertSame('0.05', Money::toDecimal(5));
        $this->assertSame('0.00', Money::toDecimal(0));
        $this->assertSame('-1.50', Money::toDecimal(-150));
        $this->assertSame('-0.01', Money::toDecimal(-1));
        $this->assertSame('100.00', Money::toDecimal(10000));
    }

    public function test_round_trip(): void
    {
        foreach (['0.00', '0.01', '-0.01', '33.34', '1234.56', '-9876.54'] as $decimal) {
            $this->assertSame($decimal, Money::toDecimal(Money::fromDecimal($decimal)));
        }
    }
}
