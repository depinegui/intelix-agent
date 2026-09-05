---
titulo: "Nota de Importação"
categoria: "Industrial"
fonte: "Industrial/3ded2236-41d6-42e4-b281-26e3b41488de_Nota_de_Importao.pdf"
arquivo_original: "3ded2236-41d6-42e4-b281-26e3b41488de_Nota_de_Importao.pdf"
paginas: 5
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Nota de Importação

## Página 1

Conferir se o produto está como importado e as alíquotas dentro do estado, se
tem a alíquota da importação, DIFAL mesma coisa.

Na aba “Complemento I” e “Fiscal”

Redigitar a CST para aparecer a origem qualquer coisa.

Fazer ela manualmente

NF de venda, tipo entrada - Para que possa emitir ela

Colocar na OBS da NF, digitação de impostos manuais

Direito do mouse no item, cód fabricante = cód cliente

Valor do imposto ref importação: Pode-se colocar nos adicionais

Verificar cliente, ver cód pais, cidade, nacionalidade, estado ...

No adicional: PESO/VOLUME/EMBALAGEM

CFOP: Custo do Produto ...

Ao transmitir a NF:

## Página 3

PARÂMETROS:
Se quiser que some todos, tem esse parâmetro abaixo.
Ele vai somar a mais o ICMS, PIS e Cofins ...
O restante já soma automaticamente sempre.
CONFIG DO COMERCIAL:
Campo que leva o total do valor de Imposto de Importação NTV_IIVALOR:
&NOTAS_VENDAS.NTV_IIVALOR AS ICMSTot_vII,

Mas se precisar somar algum imposto específico, tem esse outro.

Para recalcular na NF já digitada, colocar um valor de acessórias e clicar no
“Raio”, depois excluir e clicar novamente.

Cidade exemplo:

Usar sempre no Código Federal o 9999999

Sempre 7 noves: 9999999

## Página 4

Erro ocorrido:

”EnderDest_cMun: Erro -> Inválido.

EnderDest_UF: Erro -> Inválida.”

Conferir se dentro do estado, está vinculado o pais do cliente tbm ...

Colocar o código Bacen no país

Preencher os dados da cidade conforme exemplo acima

“VOutro” redigitar as acessórias e clicar no raio.

IMPORTANDO XML NAS NOTAS DE EMISSÃO PRÓPRIA DO TIPO ENTRADA

IMPORTAR_XML_NFE_NTV

Configurações pode pesquisar por isso se tiver SIM, então busca pelo “cProd”

Se tiver NÃO, pesquisa pelo xProd (Campo da Descrição do Produto)

Importando pelo Código, é somente pelo “cProd”

TAREFA 20220
