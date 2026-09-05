---
titulo: "Manual de Configuração — Reforma Tributária (IBS CBS)"
categoria: "Industrial"
fonte: "Industrial/142246e0-05f4-44a8-a2b0-d9c6c6387d6a_Manual_de_Configurao__Reforma_Tributria_(IBS__CBS).pdf"
arquivo_original: "142246e0-05f4-44a8-a2b0-d9c6c6387d6a_Manual_de_Configurao__Reforma_Tributria_(IBS__CBS).pdf"
paginas: 9
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Manual de Configuração — Reforma Tributária (IBS CBS)

## Página 1

Produto: Microsys Sistemas
Público-alvo: Usuários do Sistemas Microsys (consultores fiscais e técnicos de
implantação)
Objetivo: Orientar, passo a passo, a verificação e configuração das alíquotas e
tabelas
relacionadas à Reforma Tributária (IBS e CBS) no Microsys.

1. Visão geral
O Microsys já vem com alíquotas de teste para o ano de 2026. Este manual
descreve
como conferir essas alíquotas no sistema, como configurar a tributação por
NCM,
Processo Tributário e por CFOP, e onde localizar as tabelas fiscais de
apoio.
Observação: revise sempre em um ambiente de homologação antes de
promover
alterações em produção.

2. Pré-requisitos

Acesso ao Microsys com perfil que permita alterar parâmetros de sistema e
cadastros (usuário administrador ou suporte fiscal).

Permissões para acessar: Configurações, Arquivo, Tabelas Auxiliares,
Tabelas
Fiscais.

3. Conferir alíquota de CBS (sistema)

Acesse: Configurações → Parâmetro do Sistema → Aba Faturamento.

## Página 2

Localize o campo Alíquota de CBS.

Valor esperado (ambiente de teste): 0,90.
Ação: Se o valor estiver incorreto, registre o valor atual e solicite a
correção com a
equipe de suporte/infraestrutura ou atualize conforme política da
empresa (após
aprovação).

4. Conferir alíquotas de IBS (estadual)

Acesse: Arquivo → Tabelas Auxiliares → Estados.

Abra o cadastro do Estado desejado.

Localize o campo Alíquota de IBS.

Valor esperado (ambiente de teste): 0,10.

## Página 3

5. Conferir alíquotas de IBS Municipal

Acesse: Arquivo → Tabelas Auxiliares → Municípios.

Abra o cadastro do Município desejado.

Localize o campo Alíquota de IBS (Municipal).

Valor esperado (ambiente de teste): 0,00.

6. Formas de configurar a tributação no Microsys
Hoje o Microsys suporta três formas principais para mapear tributação:

6.1 Via NCM (recomendado as vendas Norma’s)

Caminho: Arquivo → Tabelas Fiscais→ Classificação Fiscal (NCM)

Neste fluxo é necessário informar:

cclasstrib (código da classificação tributária)

## Página 4

6.2 Via Processo Tributário (recomendado para quem usa controle por
produto)

Caminho: Arquivo → Produtos → Processo Tributário.

Neste fluxo é necessário informar:

cclasstrib (código da classificação tributária

o cclasstrib Regular (classificação regular relacionada)

Quando usar: Empresas que já tratam tributação por perfil do produto (cada
produto
tem seu processo tributário).

## Página 5

6.3 Via CFOP (para quem não usa Processo Tributário)

Configuração localizada na CFOP (cadastro de CFOP utilizado nas
operações).

Também é necessário informar:

cclasstrib

cclasstrib Regular

Quando usar: Empresas que tratam regras por CFOP (default por natureza de
operação) e não por produto.

7. Tabelas auxiliares e onde encontrá-las
As tabelas de apoio criadas para a Reforma Tributária estão disponíveis em:

Arquivo → Tabelas Fiscais

Nessa pasta você encontrará, entre outras, as seguintes tabelas:

## Página 6

Tabela de CST (IVA) — códigos de situação tributária (IVA/CST)

‘ para IBS / CBS

Tabela Imposto Seletivo (IS) — para tributos seletivos, se aplicável

Tabela Crédito Presumido (IVA) — para regras de crédito presumido
relacionadas ao IVA

Ação recomendada: verifique os registros dessas tabelas e confirme que os
códigos e
descrições estejam de acordo com o layout/legenda do seu fiscal.

8. Exemplo prático (fluxo típico)

Cenário: Conferir e ajustar uma alíquota estadual para um cliente fictício.

1. Acesse Arquivo → Tabelas Auxiliares → Estados.

2. Localize o Estado (ex.: SP) e abra o cadastro.

3. Confirme a Alíquota de IBS = 0,10.

4. Vá em Arquivo → Tabelas Fiscais → cclasstrib e verifique se o código
usado
pelo produto/CFOP existe e está correto.

5. Se o produto usa Processo Tributário, abra Arquivo → Produtos →
Processo
Tributário e confirme o cclasstrib vinculado ao produto.

6. Gere uma nota fiscal de teste (modo homologação) e valide os cálculos
de
IBS/CBS no total da NF.

9. Verificações e testes recomendados

Gere notas fiscais de teste cobrindo casos diferentes: operações internas,
interestaduais, vendas para consumidor final, com vários cclasstrib
referente a
sua tributação

Compare os totais com uma planilha de cálculo (para garantir que IBS e
CBS
foram aplicados conforme esperado).

Valida os dados IBS e CBS dentro do XML da nota.

Faça download do XML e valida as informações de IBS e CBS

## Página 7

Use a as teclas de atalho CTR + D e acesse os impostos de forma
detalhada

## Página 8

10. Problemas comuns e soluções rápidas

Cclasstrib informado de forma incorreto no processo tributário ou CFOP.

Diferença nos valores de homologação vs. produção: confirme se ambos
ambientes usam as mesmas tabelas e parâmetros (frequentemente o
ambiente de
produção tem atualizações diferentes).

11. Boas práticas

Envolva o contador/consultoria fiscal para validar as alíquotas e regras
antes de
aplicar em produção.

Faça alterações primeiro em homologação e documente o teste (Mantenha
controle de versão das regras fiscais (documento simples em repositório ou
planilha).

12. Configuração (MsysNFe.config)

Foi incluída uma configuração no arquivo MsysNFe.config que permite
habilitar ou desabilitar a geração das TAG(s) da Reforma Tributária.

## Página 9

O objetivo dessa marcação é impedir que as notas sejam enviadas ao
SEFAZ
durante o período de ajustes e validações da configuração

Exemplo no MsysNFe.config:
NFe.GerarTaggsReformaTributaria=1

Obs.: Caso arquivo não esteja sem em configuração o sistema irá gerar as
informações
de IBS e CBS normalmente
