# Surface: app autenticado (todas as telas de uso diário)

Mode: operate

## Direction contract

THESIS: Um painel financeiro escuro e premium, como a referência que o dono do produto escolheu (`docs/design/referencia-dashboard.png`): superfícies grafite com brilho suave, uma cor de destaque quente que acende só o que importa, e todos os dados do Financialite à vista. Recusa o dashboard branco genérico e qualquer mundo temático.

OWN-WORLD: Fundo quase preto (#0B0B0C) com um leve degradê radial mais claro no topo; cards grafite (#161618 → #1C1C1F) com borda de 1 px branca a 6–8% e um realce interno no topo (gradiente branco a 4%), raio 16 px; menu lateral em um painel próprio arredondado dentro da página. Tipografia Inter, números grandes em 600 com tabular-nums, rótulos em cinza (#9A9AA0). Destaque laranja-brasa (#F2541B, paleta nova padrão "Brasa") em botão principal, item ativo, linha principal dos gráficos (com área em degradê que some para o fundo) e ícones dos KPIs em chips escuros; a paleta escolhida pelo usuário substitui o laranja. Cores semânticas: verde para alta/positivo, vermelho para queda/alerta, âmbar para média, sempre com seta ou texto. Selos de prioridade em pílulas pequenas (Alta, Média, Baixa). Modo claro existe como contraparte (fundo #F4F4F5, cards brancos), mas o escuro é o padrão.

STORY: O usuário abre o Dashboard e lê em segundos os indicadores do mês (cada um com ícone, valor e variação), vê a evolução dos gastos no gráfico, os alertas do mês (orçamento estourado, conta vencendo, fatura fechando) e a atividade recente em tabela com abas de período; age pelas ações rápidas e pelo botão principal.

FIRST VIEWPORT: Menu lateral em painel arredondado à esquerda: logo, grupos com títulos recolhíveis (Visão geral, Movimentações, Contas e cartões, Planejamento), contador em itens com pendência, e no rodapé um card de ação (Nova transação / resumo do mês) e o usuário. Topo: busca com atalho, sino, alternar tema, avatar. Linha de 4–5 KPIs em cards com chip de ícone, valor grande e variação colorida. Abaixo, à esquerda o gráfico "Gastos mensais" (linhas com área em degradê, legenda e tooltip que segue o cursor) e à direita a coluna "Alertas do mês" com cards de alerta e selo de prioridade. Depois "Atividade recente" com controle segmentado (7 dias / 30 dias / Tudo) e tabela; seguem Orçamentos, Saúde financeira, Próximas contas, Maiores gastos, Previsão e Tendências com os dados atuais.

FORM: direção fixada pelo usuário com imagem de referência (pinned), após recusar quatro rodadas; seed: none (pinned) — "tente usar essa imagem como referencia para montar o dashboard, gostei dela".

COMPONENT REFERENCES (ideias, não cópia; código copiado vira nosso e passa pelo craft floor):
- Uiverse (MIT): card escuro de saldo com gráfico de linha brilhante e botão contornado; botão escuro com brilho suave da cor de destaque; campo de busca com atalho de teclado (⌘K/Ctrl K); switch escuro com trilho colorido; skeleton de carregamento; toast escuro com ícone e fechar.
- Spell UI (MIT): gráfico de linha com tooltip que segue o cursor e encaixa no ponto; badge com variantes de cor; atalhos de teclado (kbd); campo com label flutuante e mostrar senha (telas de login); spinner.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
