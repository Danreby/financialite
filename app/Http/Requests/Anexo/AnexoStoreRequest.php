<?php

namespace App\Http\Requests\Anexo;

use App\Models\Anexo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnexoStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $maxSizeKb = Anexo::MAX_FILE_SIZE / 1024;
        $allowedMimes = implode(',', Anexo::ALLOWED_MIME_TYPES);
        $allowedExtensions = implode(',', Anexo::ALLOWED_EXTENSIONS);
        $userId = $this->user()?->id;

        return [
            'file' => [
                'required_without:files',
                'file',
                'max:'.$maxSizeKb,
                'mimes:'.$allowedExtensions,
                'mimetypes:'.$allowedMimes,
            ],
            'files' => [
                'required_without:file',
                'array',
                'min:1',
                'max:10',
            ],
            'files.*' => [
                'file',
                'max:'.$maxSizeKb,
                'mimes:'.$allowedExtensions,
                'mimetypes:'.$allowedMimes,
            ],
            'transacao_id' => [
                'nullable',
                'integer',
                Rule::exists('transacoes', 'id')->where(function ($query) use ($userId) {
                    $query->where('user_id', $userId)->whereNull('deleted_at');
                }),
            ],
            'description' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        $maxSizeMb = Anexo::MAX_FILE_SIZE / 1024 / 1024;

        return [
            'file.required' => 'É necessário enviar um arquivo.',
            'file.file' => 'O upload não é um arquivo válido.',
            'file.max' => "O arquivo não pode exceder {$maxSizeMb}MB.",
            'file.mimes' => 'Tipo de arquivo não permitido. Tipos aceitos: '.implode(', ', Anexo::ALLOWED_EXTENSIONS),
            'file.mimetypes' => 'Tipo de arquivo não permitido.',
            'files.array' => 'Os arquivos devem ser enviados como uma lista.',
            'files.max' => 'Você pode enviar no máximo 10 arquivos por vez.',
            'files.*.file' => 'Um dos uploads não é um arquivo válido.',
            'files.*.max' => "Cada arquivo não pode exceder {$maxSizeMb}MB.",
            'files.*.mimes' => 'Tipo de arquivo não permitido. Tipos aceitos: '.implode(', ', Anexo::ALLOWED_EXTENSIONS),
            'files.*.mimetypes' => 'Tipo de arquivo não permitido.',
            'transacao_id.exists' => 'A transação selecionada não existe ou não pertence a você.',
            'description.max' => 'A descrição não pode exceder 500 caracteres.',
        ];
    }

    public function attributes(): array
    {
        return [
            'file' => 'arquivo',
            'files' => 'arquivos',
            'files.*' => 'arquivo',
            'transacao_id' => 'transação',
            'description' => 'descrição',
        ];
    }
}
