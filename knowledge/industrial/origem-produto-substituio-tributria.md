---
titulo: "Origem Produto - Substituição Tributária"
categoria: "Industrial"
fonte: "Industrial/aca21021-0fa1-4962-9e0c-48096dedaf2c_Origem_Produto_-_Substituio_Tributria.pdf"
arquivo_original: "aca21021-0fa1-4962-9e0c-48096dedaf2c_Origem_Produto_-_Substituio_Tributria.pdf"
paginas: 5
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Origem Produto - Substituição Tributária

## Página 1

CST DE ICMS NO ESPELHO É UMA, E NO MICROSYS É OUTRA

(Origem da Mercadoria)

No Config ele pega desse campo acima, e não mais desse campo abaixo.
O primeiro numero da CST pega dessa origem do produto acima.

No config estava fixo a origem da mercadoria 1.

Ajustado no config para levar a origem que está no cadastro do produto:

Caso CSOSN: Simples Nacional ...

&NVI_PRO_ORIGEM AS ICMS_orig, - USAR ESSE

## Página 2

Pega a origem do produto, pois empresas do Simples são 4 dígitos a CST
(CSOSN).

Demais regimes tributários:

&PRODUTOS_CFG_FILIAL.PCF_PRO_ORIGEM AS ICMS_orig,

Ter também esse abaixo ...

&LEFT OUTER JOIN PRODUTOS_CFG_FILIAL ON
(NOTAS_VENDAS_ITENS.NVI_PRO_CODIGO =
PRODUTOS_CFG_FILIAL.PCF_PRO_CODIGO)

&AND (NOTAS_VENDAS_ITENS.EMP_FIL_CODIGO =
PRODUTOS_CFG_FILIAL.PCF_FIL_CODIGO)

Para pegar da CST:

Caso estiver como &NULL AS ICMS_orig, pegará o primeiro digito da CST de
ICMS.

Por exemplo, CST 120, a origem será 1.

CST 000, a origem será 0.

SUBSTITUIÇÃO TRIBUTÁRIA:

CST 010

Config:

&'4' AS ICMS_ModBCST,

&NOTAS_VENDAS_ITENS.NVI_MARGEM AS ICMS_pMVAST,

&NOTAS_VENDAS_ITENS.NVI_SUBSTBASE AS ICMS_vBCST,

&NOTAS_VENDAS_ITENS.NVI_SUBSTALIQUOTA AS ICMS_pICMSST

&NOTAS_VENDAS_ITENS.NVI_SUBSTICMS AS ICMS_vICMSST,

NO MSYS

Precisa dentro do produto a aba “substituição tributária” estar como SIM.

## Página 3

CFOP:
“Cálculo ST obs na NF”: Precisa estar como “NÃO”
Se tiver como sim, irá calcular somente no Orçamento, nos Pedidos e nas NFs
não.

## Página 4

Esse parâmetro abaixo, depende do cliente, para alguns pode ser “sim” e para
outros “não”.

Revenda e Consumidor Final (As vezes Consumidor Final não)

Dentro do cadastro de , os campos “alíquota ICMS e Alíquota Substituição
(Interna)” estarem com os respectivos valores. “Substituição Pauta” como
SIM

estados

Na CFOP:

Substituição: SIM

Diferencial de Alíquota: NÃO

Diferencial ST obs na NF: NÃO

Impostos já pagos anteriormente, o que produz quase sempre é o que paga.
Ele acaba pagando o imposto antecipadamente, na maioria da vezes o ICMS,
paga os próprios, do revendedor e do consumidor final.

## Página 5

É repassado no valor do produto.

IPI - Imposto sobre Produto Industrializado.

PIS e COFINS - Criados p/ auxiliar no pagamento de aposentadorias e
encostados pelo INSS.

São monofásicos (1 fase só) mesma situação da ST, recolhidos só 1 vez por
quem produziu.

É repassado no valor do produto.

SUBSTITUIÇÃO TRIBUTÁRIA - ST

CALCULO MVA:

CFOP:

Processo Tributário:
