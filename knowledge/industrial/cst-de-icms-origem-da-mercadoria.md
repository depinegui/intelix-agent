---
titulo: "CST de ICMS - Origem da Mercadoria"
categoria: "Industrial"
fonte: "Industrial/e5d2b133-f177-4f8d-8905-7a52cb928c3c_CST_de_ICMS_-_Origem_da_Mercadoria.pdf"
arquivo_original: "e5d2b133-f177-4f8d-8905-7a52cb928c3c_CST_de_ICMS_-_Origem_da_Mercadoria.pdf"
paginas: 2
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# CST de ICMS - Origem da Mercadoria

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
