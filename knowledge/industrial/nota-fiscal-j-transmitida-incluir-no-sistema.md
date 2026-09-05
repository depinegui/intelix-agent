---
titulo: "Nota Fiscal já Transmitida - Incluir no Sistema"
categoria: "Industrial"
fonte: "Industrial/9ea42ac6-9339-4e1d-9a81-f2e070ffee0e_Nota_Fiscal_j_Transmitida_-_Incluir_no_Sistema.pdf"
arquivo_original: "9ea42ac6-9339-4e1d-9a81-f2e070ffee0e_Nota_Fiscal_j_Transmitida_-_Incluir_no_Sistema.pdf"
paginas: 2
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Nota Fiscal já Transmitida - Incluir no Sistema

## Página 1

NOTA FISCAL TRANSMITIDA NO SISTEMA - ACRESCENTAR/INCLUIR -
H2J/OUTROS

Se cliente utiliza controle por pedido, pedir para ele fazer o pedido e então
importar para a NF.

Na NF, ajustar a numeração dela, data de emissão, fazer gerar o financeiro
clicando em parcelas e reprocessar o fechamento dela.

No IB:

Abrir a tabela NFE e acrescentar manualmente a linha, seguindo a sequencia
da ultima.

Colocar o Número do Protocolo também, está no fim do XML.

NTV_NFE_ID somente o número

Precisa ter o arquivo XML da NF para subir no sistema.

Nesse select abaixo, validar informações também ...

(nfe_id = XML)

Select

NOTAS_VENDAS.ntv_numero,

NOTAS_VENDAS.ntv_nfe_id,

NOTAS_VENDAS.ntv_situacao,

NOTAS_VENDAS.ntv_nfe_dt_transmissao,

NOTAS_VENDAS.ntv_nfe_transmissao,

NOTAS_VENDAS.emp_fil_codigo,

notas_vendas.ntv_serie,

notas_vendas.ntv_numero,

## Página 2

notas_vendas.ntv_notafiscal

from

notas_vendas

where notas_vendas.ntv_numero = 1122

Buscas a NF no sistema e tentar transmitir ela, vai dizer que já foi transmitida,
se queremos ver o DOC, se não aparecer isso algo não ficou certo, verificar os
passos novamente.

VINCULAR O DOWNLOAD DO XML:
