---
titulo: "Cartão de Crédito - TEF"
categoria: "Industrial"
fonte: "Industrial/ed6b298f-7d09-45c3-9443-609b260bcd58_Carto_de_Crdito_-_TEF.pdf"
arquivo_original: "ed6b298f-7d09-45c3-9443-609b260bcd58_Carto_de_Crdito_-_TEF.pdf"
paginas: 4
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Cartão de Crédito - TEF

## Página 1

FATURA TEF - CARTÃO DE CRÉDITO

Primeiramente precisa ser feito o cadastro do cartão de crédito.

< Financeiro <TEF - Transferência Eletrônica de Fundos <Cadastro de
Operadoras

"Tipo Documento e Portador" colocar como cartão de crédito se preferir, fica
melhor para o controle por filtros. (CRIAR AMBOS)

TIPO DE PGTO <Arquivos <Tabelas Financeiro <Tipos Documentos -
Cartão de Crédito

PORTADORES <Arquivos <Tabelas Financeiro <Portadores de títulos -
Cartão de Crédito

Em "Cadastro de Taxas", criasse as tipos de pagamento, (débito, crédito,
crédito em 2x, 3x, 4...)

Criar também as “Condições de pagamento”

<Arquivos <Setor de Vendas <Condições de Pagamento ...

(Pode ser que de 1x até 5x a taxa seja a mesma, então criasse uma só se feito
NF)

(Se for PEDIDO, precisa criar individualmente as condições, para gerar as
parcelas conforme a venda, 1X, 2X, 3X etc.)

- Forma de pgto e Tipo pgto, débito no débito e crédito no crédito

- Tipo aplicação: AMBOS

- Percentual Juros: NADA

- Taxa cartão de crédito: NADA

- Taxa sobre venda: NADA

- Pagamento por TEF: “SIM” se for fazer NOTA FISCAL, se for somente PEDIDO,
colocasse “NÃO”.

## Página 2

- Dias: 30 em 30 por exemplo

Volta em "cadastro de Operadoras, e vincula eles com as suas respectivas
taxas.

Nas observações da fatura fechada no contas a receber, mostra o nome
dos clientes a qual a fatura pertence.

Se possuir contábil ...

TAXA TEF PARA CONTABILIZAR, USAR O 17 NA ROTINA:

VENDA:

É feito a NF de venda, colocando "ind pagamento" como cartão, e em "forma
pgto" como cartão também. (ESSAS INFORMAÇÕES JÁ VEM DA CONDIÇÃO DE
PGTO)

Dentro do complemento do pedido/NF em “TEF Operadora” também informar a
operadora.

Após concretizado a venda e feito a NF, vai-se em: < Financeiro <TEF -
Transferência Eletrônica de Fundos <Lançamento de faturas/Em Lote

Busca as faturas, e faz o financeiro do contas a receber em nome da operadora
do cartão.

Precisa ser colocado manualmente a quantidade de parcelas e os valores
conforme a venda.

## Página 3

SE CLIENTE DER ENTRADA/ADIANTAMENTO/OUTRAS FORMAS DE
PAGAMENTO + CARTÃO:

Fazer a NF com parcela normal, sem ser cartão de crédito (Gerando assim o
financeiro em nome do cliente com as parcelas separadas conforme os
pagamentos efetuados, cada uma com seu respectivo valor).

Para não duplicar nos relatórios, fazer a alteração do “Portador” na parcela que
será baixada como “Cartão de Crédito”.

Colocar um “Portador” que está marcado IMPRIMIR NOS RELATÓRIOS como
“Não”.

Posteriormente fazer a baixa do financeiro gerado do cliente com o
adiantamento, ou outra forma que o cliente tenha pagado ...

Ai o restante que ele pagou como cartão, fazer a baixa como “Cartão de
Crédito” que irá puxar a fatura TEF a ser gerada.

Posteriormente com a Fatura TEF gerada, quando a maquininha de cartão
pagar, precisa entrar no Contas a Receber em nome da maquininha e fazer a
baixa.

## Página 4

LOTE DE RECEBIMENTO - CARTÃO

Ao usar essa tela e fazer a baixa com “Cartão,” o sistema já gera
automaticamente a fatura TEF conforme os dados colocados nessa tela ...

Precisando ir apenas no contas a receber e fazer a baixa conforme as
operadoras informadas.
