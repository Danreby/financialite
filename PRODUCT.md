# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pessoas em geral que querem controlar as próprias finanças, principalmente o cartão de crédito. O cadastro é público. O uso mais comum é no computador, com calma, revisando o mês: conferir a fatura, as contas a pagar, as receitas e os relatórios. Também existe um APK Android (`public/downloads/financialite.apk`) que consome a API `v1`.

## Product Purpose

Mostrar com clareza quanto a pessoa deve, quando vence e de onde sai o dinheiro. O usuário cadastra cartões e contas bancárias, lança compras à vista, parceladas ou recorrentes, acompanha a fatura de cada mês, paga a fatura debitando de uma conta e controla contas a pagar, receitas, orçamentos por categoria e metas de economia. Sucesso é o usuário fechar o mês sabendo exatamente o que pagou, o que falta e quanto sobra, sem planilha paralela.

## Positioning

O centro é o cartão de crédito: cada compra cai no mês de fatura certo pelo dia de fechamento do cartão, parcelas e recorrências se distribuem sozinhas, e o pagamento da fatura sai de uma conta bancária com histórico de saldo (ledger). Em produção em https://financialite.rolims.com.

## Operating Context

- Revisão mensal no computador: Dashboard, Fatura, Transações, Extrato, Resumo mensal, Relatórios e Projeção.
- Cadastro e manutenção: Cartões, Bancos, Categorias, Contas a pagar, Parcelamentos, Configurações.
- Exportação para Excel e anexos de comprovantes (PDF e imagens) nas transações.
- Login por e-mail e senha ou Google; e-mail verificado é exigido para usar a API.

## Capabilities and Constraints

- Stack existente: Laravel 12, Inertia 2, React 18, Tailwind 3.4, Vite 7, Chart.js, framer-motion, lucide-react. API Sanctum `v1` para o app Android.
- Interface em português do Brasil, valores em reais (R$).
- CSP com nonce ativa em produção: scripts externos novos precisam entrar na política (`config/security.php`).
- Ainda não decidido: landing page pública (hoje `/` só redireciona para login ou dashboard); páginas próprias para Orçamentos, Metas e Receitas.

## Brand Commitments

- Nome: Financialite.
- O usuário escolhe uma paleta de cores (rosa, verde, dourado, lavanda, meia-noite, preto) e o modo claro ou escuro. Os dois recursos continuam; o redesenho pode mudar como as cores são aplicadas, não remover a escolha.
- Direção visual fixada pelo dono do produto (19/11/2026): painel escuro premium conforme a imagem de referência `docs/design/referencia-dashboard.png` (grafite com brilho suave, destaque laranja, cards arredondados, menu em painel próprio). Escuro é o modo padrão; o claro continua disponível. As telas mantêm os componentes que já existem (o Dashboard com seus 10 blocos) e mostram todos os dados. Referência de acabamento: apps web do Nubank e do Inter.

## Evidence on Hand

- Produto em produção com usuários reais; não há depoimentos, números de uso ou imprensa registrados no repositório. Não inventar nada disso.
- Logo em `public/` (ícone usado no menu lateral).

## Product Principles

1. Dinheiro certo antes de tudo: nenhum número exibido pode ser ambíguo sobre o que é receita, despesa, pago ou pendente.
2. O mês é a unidade: tudo se organiza pela fatura e pelo mês de referência.
3. Calma para revisar: a tela de uso diário favorece leitura e comparação, não espetáculo.
4. Escolha pessoal sem perder clareza: a paleta do usuário personaliza, mas nunca disfarça um alerta.

## Accessibility & Inclusion

Seguir WCAG 2.1 AA (contraste de texto 4,5:1, foco visível, rótulos em todos os campos) e respeitar `prefers-reduced-motion`. Estados como vencido, pago e alerta não podem depender só de cor.
