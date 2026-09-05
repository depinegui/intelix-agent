---
titulo: "Baixa de Estoque"
categoria: "Industrial"
fonte: "Industrial/71b0b6f5-2332-4112-91b8-8e0043546809_Baixa_de_Estoque.pdf"
arquivo_original: "71b0b6f5-2332-4112-91b8-8e0043546809_Baixa_de_Estoque.pdf"
paginas: 2
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Baixa de Estoque

## Página 1

BAIXA DE ESTOQUE - PELO PEDIDO

Somente inserindo o produto no pedido, já baixa do estoque.

Depois quando for faturado a NF, o sistema substitui o lançamento do
estoque pela NF.

Para não movimentar, usar o orçamento.

COMERCIAL e INDUSTRIAL:

Se a ficha técnica do produto está para ser baixada no fechamento do pedido,
depois de fechado, se abrir o pedido o estoque não volta mais, somente
excluindo o pedido.

Comercial:

<Parâmetros do Sistema <Processo de Vendas <Nota Fiscal de Venda: Estoque
na Nota Fiscal: NÃO (Ai fica pelo pedido, se SIM fica pela NF)

Baixar ficha técnica manual: Dentro do do produto, “Movimenta Ficha” tem que
estar como NÃO, ai somente baixará a ficha técnica na requisição, se estiver
como SIM baixará no pedido de venda.

Industrial:

<Configurações de Sistema <Produtos <Baixa estoque do produto da ficha
técnica: SIM

<Configurações de Sistema <Pedidos de Venda <Habilitar botões abrir e
fechar: SIM

<Configurações de Sistema <Pedidos de Venda <Fechar pedido altera somente
Status: NÃO

<Cadastro de Filiais <Configurações I <Estoque NF S/ Pedido: NÃO

<Cadastro de Filiais <Configurações I <Estoque na emissão dos pedidos de
venda: SIM

----------------------------------------------------------------

## Página 2

BAIXA ESTOQUES - PELA NOTA FISCAL

<Configurações de Sistema <Pedidos de Venda <Fechar pedido altera somente
Status: SIM

<Cadastro de Filiais <Configurações I <Estoque NF S/ Pedido: SIM

<Cadastro de Filiais <Configurações I <Estoque na emissão dos pedidos de
venda: NÃO

----------------------------------------------------------------

BAIXA ESTOQUE - PELO PEDIDO OU PELA NOTA

Situações:

Se o pedido for fechado, a baixa do estoque ocorrerá apenas pelo pedido

Se uma nota for emitida de um pedido que ja esta fechado, a baixa de estoque
da nota substitui a baixa de estoque que havia ocorrido quando o pedido foi
fechado

Se uma nota for emitida de um pedido que esta aberto, no momento da
emissão da nota, o pedido será fechado e a baixa de estoque ocorrera

Se uma nota sem pedido for emitida, a baixa de estoque ocorrerá no momento
da emissão da nota fiscal

Parametros:

<Configurações de Sistema <Produtos <Baixa estoque do produto da ficha
técnica: 0

<Configurações de Sistema <Pedidos de Venda <Habilitar botões abrir e
fechar: SIM

Se estiver como não, a única forma de fechar o pedido será pela alteração de
status (permissão de gerente)

<Configurações de Sistema <Pedidos de Venda <Fechar pedido altera somente
Status: NÃO

<Cadastro de Filiais <Configurações I <Estoque NF S/ Pedido: SIM

<Cadastro de Filiais <Configurações I <Estoque na emissão dos pedidos de
venda: NAO
