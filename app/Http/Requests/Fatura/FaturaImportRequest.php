<?php

namespace App\Http\Requests\Fatura;

use App\Security\Rules\SafeNumeric;
use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FaturaImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'rows' => [
                'required',
                'array',
                'min:1',
                'max:500',
            ],
            'rows.*.title' => [
                'required',
                'string',
                'min:2',
                'max:255',
                new SafeString(255),
            ],
            'rows.*.description' => [
                'nullable',
                'string',
                'max:1000',
                new SafeString(1000),
            ],
            'rows.*.amount' => [
                'required',
                SafeNumeric::money(0.01, 999999999.99),
            ],
            'rows.*.type' => [
                'required',
                'string',
                Rule::in(['credit', 'debit']),
            ],
            'rows.*.status' => [
                'nullable',
                'string',
                Rule::in(['unpaid', 'paid', 'overdue']),
            ],
            'rows.*.total_installments' => [
                'nullable',
                'integer',
                'min:1',
                'max:360',
            ],
            'rows.*.current_installment' => [
                'nullable',
                'integer',
                'min:0',
                'max:360',
            ],
            'rows.*.is_recurring' => [
                'nullable',
                'boolean',
            ],
            'rows.*.bank_user_name' => [
                'nullable',
                'string',
                'max:255',
                new SafeString(255),
            ],
            'rows.*.category_name' => [
                'nullable',
                'string',
                'max:255',
                new SafeString(255),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'rows.required' => 'Os dados de importação são obrigatórios.',
            'rows.max' => 'O limite de importação é de 500 registros por vez.',
            'rows.*.title.required' => 'O título é obrigatório na linha :position.',
            'rows.*.amount.required' => 'O valor é obrigatório na linha :position.',
            'rows.*.type.required' => 'O tipo é obrigatório na linha :position.',
            'rows.*.type.in' => 'O tipo na linha :position deve ser crédito ou débito.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('rows') && is_array($this->rows)) {
            $rows = collect($this->rows)->map(function ($row) {
                if (isset($row['is_recurring'])) {
                    $row['is_recurring'] = filter_var($row['is_recurring'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
                }

                if (isset($row['title']) && is_string($row['title'])) {
                    $row['title'] = trim($row['title']);
                }
                if (isset($row['description']) && is_string($row['description'])) {
                    $row['description'] = trim($row['description']);
                }
                if (isset($row['bank_user_name']) && is_string($row['bank_user_name'])) {
                    $row['bank_user_name'] = trim($row['bank_user_name']);
                }
                if (isset($row['category_name']) && is_string($row['category_name'])) {
                    $row['category_name'] = trim($row['category_name']);
                }

                return $row;
            })->all();

            $this->merge(['rows' => $rows]);
        }
    }
}
