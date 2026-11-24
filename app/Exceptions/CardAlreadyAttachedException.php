<?php

namespace App\Exceptions;

use App\Models\CardUser;
use DomainException;

/**
 * O usuário tentou vincular um cartão que já está vinculado a ele. Carrega o vínculo
 * existente, que a web devolve na resposta (already_attached).
 */
class CardAlreadyAttachedException extends DomainException
{
    public function __construct(public readonly CardUser $cardUser)
    {
        parent::__construct('Este cartão já está vinculado ao usuário.');
    }
}
