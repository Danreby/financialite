<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Dinheiro em centavos inteiros. O banco guarda decimal(15,2); o código calcula
 * em int e só converte nas pontas: Money::fromDecimal ao ler e Money::toDecimal
 * ao gravar.
 *
 * Arredondamento: meio para cima, longe do zero ("0.005" vira 1 centavo,
 * "-0.005" vira -1), igual ao round() do PHP.
 */
final class Money
{
    /** decimal(15,2) cabe em 13 dígitos inteiros; 15 deixa folga e não estoura int64. */
    private const MAX_INTEGER_DIGITS = 15;

    /**
     * Converte um valor decimal ("123.45", 123, 123.45) em centavos.
     * Strings são lidas dígito a dígito, sem passar por float. Floats passam antes
     * por number_format com duas casas.
     */
    public static function fromDecimal(string|int|float $value): int
    {
        if (is_int($value)) {
            return self::parse((string) $value);
        }

        if (is_float($value)) {
            if (! is_finite($value)) {
                throw new InvalidArgumentException('Valor monetário inválido.');
            }

            return self::parse(number_format($value, 2, '.', ''));
        }

        $value = trim($value);

        // Notação científica ("1e3") passa na validação "numeric" do Laravel.
        if (is_numeric($value) && preg_match('/[eE]/', $value)) {
            return self::fromDecimal((float) $value);
        }

        return self::parse($value);
    }

    /** Centavos para a string que o banco espera: 12345 vira "123.45". */
    public static function toDecimal(int $cents): string
    {
        $sign = $cents < 0 ? '-' : '';
        $abs = abs($cents);

        return sprintf('%s%d.%02d', $sign, intdiv($abs, 100), $abs % 100);
    }

    /**
     * Divide um valor em partes que somam exatamente o total. O resto vai, um
     * centavo por vez, para as primeiras partes: 10000 em 3 dá [3334, 3333, 3333].
     *
     * @return array<int, int>
     */
    public static function split(int $cents, int $parts): array
    {
        if ($parts < 1) {
            throw new InvalidArgumentException('O número de partes deve ser maior que zero.');
        }

        $sign = $cents < 0 ? -1 : 1;
        $abs = abs($cents);
        $base = intdiv($abs, $parts);
        $remainder = $abs % $parts;

        $result = [];
        for ($i = 0; $i < $parts; $i++) {
            $result[] = $sign * ($base + ($i < $remainder ? 1 : 0));
        }

        return $result;
    }

    private static function parse(string $value): int
    {
        if (! preg_match('/^([+-])?(\d*)(?:\.(\d*))?$/', $value, $m) || ($m[2] === '' && ($m[3] ?? '') === '')) {
            throw new InvalidArgumentException("Valor monetário inválido: \"{$value}\".");
        }

        $negative = $m[1] === '-';
        $integer = ltrim($m[2], '0');
        $fraction = $m[3] ?? '';

        if (strlen($integer) > self::MAX_INTEGER_DIGITS) {
            throw new InvalidArgumentException("Valor monetário grande demais: \"{$value}\".");
        }

        $cents = (int) ($integer === '' ? '0' : $integer) * 100
            + (int) str_pad(substr($fraction, 0, 2), 2, '0');

        if (strlen($fraction) > 2 && $fraction[2] >= '5') {
            $cents++;
        }

        return $negative ? -$cents : $cents;
    }
}
