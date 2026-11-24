<?php

namespace App\Queries\Export;

use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Border;
use OpenSpout\Common\Entity\Style\BorderPart;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\Common\Entity\Sheet;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Options;
use OpenSpout\Writer\XLSX\Writer;

/**
 * Peças comuns das planilhas: estilos (os mesmos tons da exportação antiga),
 * montagem de linhas e abertura do writer.
 *
 * Texto sempre vira célula de texto: um título que comece com "=" não pode
 * virar fórmula na planilha.
 */
final class Xlsx
{
    public const CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    public const CURRENCY = '"R$" #,##0.00';

    public const PERCENT = '0.00%';

    public const GREEN = '276221';

    public const RED = '9C0006';

    /** @var array<string, Style> */
    private array $styles = [];

    public function __construct(public readonly Writer $writer, public readonly Options $options) {}

    /** @param  string|null  $tempFolder  pasta de trabalho do OpenSpout (padrão: sys_get_temp_dir()) */
    public static function open(string $path = 'php://output', ?string $tempFolder = null): self
    {
        $options = new Options;
        if ($tempFolder !== null) {
            $options->setTempFolder($tempFolder);
        }
        $writer = new Writer($options);
        $writer->openToFile($path);

        return new self($writer, $options);
    }

    /** Nome do arquivo em pt-BR com data e hora: prefixo_23-11-2026_14-30.xlsx */
    public static function filename(string $prefix): string
    {
        return $prefix.'_'.now()->format('d-m-Y_H-i').'.xlsx';
    }

    public function close(): void
    {
        $this->writer->close();
    }

    /**
     * Aba nova com nome, larguras e (opcional) cabeçalho congelado.
     *
     * @param  list<int|float>  $widths
     */
    public function sheet(string $name, array $widths = [], bool $freezeHeader = false, bool $first = false): Sheet
    {
        $sheet = $first ? $this->writer->getCurrentSheet() : $this->writer->addNewSheetAndMakeItCurrent();
        $sheet->setName($name);

        foreach ($widths as $index => $width) {
            $sheet->setColumnWidth($width, $index + 1);
        }

        if ($freezeHeader) {
            $sheet->setSheetView((new SheetView)->setFreezeRow(2));
        }

        return $sheet;
    }

    /** Título mesclado na primeira linha da aba atual, de A até a coluna $lastColumn (0 = A). */
    public function mergeTitle(Sheet $sheet, int $lastColumn): void
    {
        $this->options->mergeCells(0, 1, $lastColumn, 1, $sheet->getIndex());
    }

    /**
     * @param  list<mixed>  $values
     * @param  array<int, Style|null>  $styles  estilo por coluna
     */
    public function add(array $values, array $styles = [], ?Style $rowStyle = null): void
    {
        $cells = [];
        foreach ($values as $index => $value) {
            $cells[] = $this->cell($value, $styles[$index] ?? $rowStyle);
        }

        $this->writer->addRow(new Row($cells));
    }

    /** @param list<string> $labels */
    public function header(array $labels): void
    {
        $this->add($labels, [], $this->style('header'));
    }

    private function cell(mixed $value, ?Style $style): Cell
    {
        if (is_string($value) && $value !== '') {
            return new StringCell($value, $style);
        }

        if ($value !== null && ! is_scalar($value) && ! $value instanceof \DateTimeInterface) {
            $value = (string) $value;
        }

        return Cell::fromValue($value, $style);
    }

    public function style(string $name): Style
    {
        return $this->styles[$name] ??= $this->makeStyle($name);
    }

    private function makeStyle(string $name): Style
    {
        $thin = new Border(
            new BorderPart(Border::TOP, '000000', Border::WIDTH_THIN),
            new BorderPart(Border::BOTTOM, '000000', Border::WIDTH_THIN),
            new BorderPart(Border::LEFT, '000000', Border::WIDTH_THIN),
            new BorderPart(Border::RIGHT, '000000', Border::WIDTH_THIN),
        );
        $total = new Border(
            new BorderPart(Border::TOP, '000000', Border::WIDTH_MEDIUM),
            new BorderPart(Border::BOTTOM, '000000', Border::WIDTH_MEDIUM),
            new BorderPart(Border::LEFT, '000000', Border::WIDTH_THIN),
            new BorderPart(Border::RIGHT, '000000', Border::WIDTH_THIN),
        );

        $style = new Style;

        return match ($name) {
            'header' => $style->setBackgroundColor('1F2B5E')->setFontColor('FFFFFF')->setFontBold()
                ->setCellAlignment(CellAlignment::CENTER)->setBorder($thin),
            'subHeader' => $style->setBackgroundColor('4472C4')->setFontColor('FFFFFF')->setFontBold(),
            'title' => $style->setBackgroundColor('305496')->setFontColor('FFFFFF')->setFontBold()
                ->setFontSize(14)->setCellAlignment(CellAlignment::CENTER),
            'currency' => $style->setFormat(self::CURRENCY)->setCellAlignment(CellAlignment::RIGHT),
            'percent' => $style->setFormat(self::PERCENT)->setCellAlignment(CellAlignment::CENTER),
            'currencyPositive' => $style->setFormat(self::CURRENCY)->setFontColor(self::GREEN)
                ->setBackgroundColor('C6EFCE')->setFontBold(),
            'currencyNegative' => $style->setFormat(self::CURRENCY)->setFontColor(self::RED)
                ->setBackgroundColor('FFC7CE')->setFontBold(),
            'percentPositive' => $style->setFormat(self::PERCENT)->setFontColor(self::GREEN)->setFontBold(),
            'percentNegative' => $style->setFormat(self::PERCENT)->setFontColor(self::RED)->setFontBold(),
            'statusPaid' => $style->setBackgroundColor('C6EFCE')->setFontColor(self::GREEN)
                ->setCellAlignment(CellAlignment::CENTER)->setBorder($thin),
            'statusPending' => $style->setBackgroundColor('FFEB9C')->setFontColor('9C5700')
                ->setCellAlignment(CellAlignment::CENTER)->setBorder($thin),
            'total' => $style->setBackgroundColor('FFF2CC')->setFontBold()->setBorder($total),
            'totalCurrency' => $style->setBackgroundColor('FFF2CC')->setFontBold()->setBorder($total)
                ->setFormat(self::CURRENCY),
            'totalPercent' => $style->setBackgroundColor('FFF2CC')->setFontBold()->setBorder($total)
                ->setFormat(self::PERCENT),
            'bold' => $style->setFontBold(),
            default => $style,
        };
    }
}
