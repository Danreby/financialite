<?php

namespace App\Http\Requests\Anexo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnexoAttachRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'anexo_id' => [
                'required',
                Rule::exists('anexos', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
            'transacao_id' => [
                'required',
                Rule::exists('transacoes', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'anexo_id.required' => 'O anexo é obrigatório.',
            'anexo_id.exists' => 'O anexo selecionado não existe ou não pertence a você.',
            'transacao_id.required' => 'A transação é obrigatória.',
            'transacao_id.exists' => 'A transação selecionada não existe ou não pertence a você.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'anexo_id' => 'anexo',
            'transacao_id' => 'transação',
        ];
    }
}
