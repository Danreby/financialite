<?php

namespace App\Http\Requests\Bank;

use App\Security\Rules\SafeString;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validated and secured form request for updating banks.
 */
class BankUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $bankId = $this->route('bank');

        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                'unique:banks,name,' . $bankId,
                new SafeString(255),
            ],
            'due_day' => [
                'nullable',
                'integer',
                'min:1',
                'max:31',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'O nome do banco é obrigatório.',
            'name.min' => 'O nome deve ter pelo menos :min caracteres.',
            'name.max' => 'O nome não pode ter mais de :max caracteres.',
            'name.unique' => 'Já existe um banco com este nome.',
            'due_day.min' => 'O dia de vencimento deve ser entre 1 e 31.',
            'due_day.max' => 'O dia de vencimento deve ser entre 1 e 31.',
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('name') && is_string($this->name)) {
            $this->merge(['name' => trim($this->name)]);
        }
    }
}
