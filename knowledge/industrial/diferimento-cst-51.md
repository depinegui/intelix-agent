---
titulo: "Diferimento CST 51"
categoria: "Industrial"
fonte: "Industrial/fd1a7781-01f1-4b1e-ba20-361813bf2f70_Diferimento_CST_51.pdf"
arquivo_original: "fd1a7781-01f1-4b1e-ba20-361813bf2f70_Diferimento_CST_51.pdf"
paginas: 3
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Diferimento CST 51

## Página 1

DIFERIDO - DIFERIMENTO

CST 51

Empresas do SIMPLES não tem diferimento.

Diferimento somente para emissão dentro do próprio estado.

Como o próprio nome sugere, a substituição tributária é um regime no qual
apenas um contribuinte de toda uma cadeia é responsável pela arrecadação do
ICMS (o Imposto sobre Circulação de Mercadorias e Prestação de Serviços de
Transporte Interestadual e Intermunicipal e de Comunicação), livrando outras
empresas dessa pendência.

Ou seja, todo o imposto que seria cobrado individualmente em cada uma das
fases de venda e comercialização é recolhido de uma só vez.

Calculando para revenda e consumo ... Olhar essa parte do Processo Tributário

INDUSTRIAL:

&NOTAS_VENDAS_ITENS.NVI_ICMS_DEFERIDO AS ICMS_vICMSDif,

&NOTAS_VENDAS_ITENS.NVI_ICMS_PERC_DEFERIDO AS ICMS_pDif,

COMERCIAL:

&NOTAS_VENDAS_ITENS.NVI_ICMS_DIFERIDO AS ICMS_vICMSDif,

&NOTAS_VENDAS_ITENS.NVI_ICMS_PERC_DIFERIDO AS ICMS_pDif,

Junto com ...

CONFIG:

&NOTAS_VENDAS_ITENS.NVI_ICMS_DEFERIDO AS ICMS_vICMSDif,

&NOTAS_VENDAS_ITENS.NVI_ICMS_PERC_DEFERIDO AS ICMS_pDif,

&NOTAS_VENDAS_ITENS.NVI_ICMS_VL_OPE AS ICMS_vICMSOp,

&NOTAS_VENDAS_ITENS.NVI_DES_ICMS_VL AS ICMS_vICMSDeson,

&NOTAS_VENDAS.NTV_DES_ICMS_VALOR AS ICMSTot_vICMSDeson,

## Página 2

&NOTAS_VENDAS_ITENS.NVI_CBENEF_REDBC AS Icms_cBenefRBC,

EMITINDO A NF:

Item 1:

Item 2:

## Página 3

Se tiver porcentagem no campo “Alíquota”, precisa informar então no campo
“%Redução Diferido” porcentagem que será diferido.
Se não tiver a porcentagem no campo “Alíquota”, o sistema pega a
porcentagem para fazer o cálculo do campo “%Diferido”.
