<?php

namespace App\Mail;

use Mailtrap\MailtrapClient;
use Mailtrap\Mime\MailtrapEmail;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;
use Symfony\Component\Mime\RawMessage;

class MailtrapTransport extends AbstractTransport
{
    private string $apiKey;

    public function __construct(
        string $apiKey,
        ?EventDispatcherInterface $dispatcher = null,
        ?LoggerInterface $logger = null
    ) {
        parent::__construct($dispatcher, $logger);
        $this->apiKey = $apiKey;
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $mailtrapEmail = new MailtrapEmail();

        // From
        $from = $email->getFrom()[0] ?? null;
        if ($from) {
            $mailtrapEmail->from(new Address($from->getAddress(), $from->getName() ?? ''));
        }

        // To
        foreach ($email->getTo() as $to) {
            $mailtrapEmail->addTo(new Address($to->getAddress(), $to->getName() ?? ''));
        }

        // CC
        foreach ($email->getCc() as $cc) {
            $mailtrapEmail->addCc(new Address($cc->getAddress(), $cc->getName() ?? ''));
        }

        // BCC
        foreach ($email->getBcc() as $bcc) {
            $mailtrapEmail->addBcc(new Address($bcc->getAddress(), $bcc->getName() ?? ''));
        }

        // Subject
        $mailtrapEmail->subject($email->getSubject() ?? '');

        // Body
        if ($email->getHtmlBody()) {
            $mailtrapEmail->html($email->getHtmlBody());
        }

        if ($email->getTextBody()) {
            $mailtrapEmail->text($email->getTextBody());
        }

        // Send via Mailtrap API
        MailtrapClient::initSendingEmails(apiKey: $this->apiKey)->send($mailtrapEmail);
    }

    public function __toString(): string
    {
        return 'mailtrap+api://';
    }
}
