---
titulo: "Manual de Cadastro de Tributações – Explicado"
categoria: "Gestor-Docs"
fonte: "Gestor-Docs/dd874fc0-a95d-4c4d-a428-1497e8c3d78d_Manual_de_Cadastro_de_Tributaes__Explicado.pdf"
arquivo_original: "dd874fc0-a95d-4c4d-a428-1497e8c3d78d_Manual_de_Cadastro_de_Tributaes__Explicado.pdf"
paginas: 5
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Manual de Cadastro de Tributações – Explicado

## Página 1

Este manual mostra passo a passo como configurar todas as tributações do
sistema.
A ideia é que mesmo quem não entende de contabilidade consiga
compreender o fluxo completo de impostos e vínculos

1. Onde configurar
Acesse o menu lateral Cadastros → Fiscal. Aqui ficam as configurações
que determinam como o sistema calcula impostos:
• NCM identifica o produto.
• Operações fiscais definem o tipo de nota (venda, compra, devolução).
• Tributações Federal e Estadual definem os impostos e suas alíquotas.
A sequência correta é: Operações → Tributação Federal → Tributação
Estadual → NCM.

## Página 2

2)Tributação Federal
A Tributação Federal define os impostos nacionais: IPI, PIS e COFINS.
Essas informações vêm da contabilidade do cliente e dependem do
enquadramento fiscal (Simples, Lucro Presumido, etc.)
Você deve preencher CSTs, bases de cálculo e alíquotas para cada tributo.
Por que: o sistema precisa dessas informações para preencher
automaticamente os tributos federais na nota.
Sem isso, a NF pode sair incorreta ou rejeitada pela SEFAZ

3)Tributação Estadual – ICMS e vínculo com Federal
A Tributação Estadual controla o ICMS e se conecta à Tributação Federal.
Crie uma nova tributação estadual, descreva claramente (ex: 'Venda' ou
'Devolução') e vincule à Tributação Federal correspondente.
Em seguida, defina as regras por UF: CFOP, CST/CSOSN e alíquotas de ICMS e
ICMS-ST. Por que: o ICMS varia conforme o estado de destino; sem isso, o
cálculo da nota será incorreto

## Página 3

4)Operações Fiscais – O tipo de movimento da nota
As operações fiscais definem se a nota é de entrada (compra) ou saída (venda,
devolução, etc.) Por que: é a operação fiscal que aciona automaticamente a
tributação correta na emissão da nota. Exemplo: ao escolher 'Venda', o sistema
busca a Tributação Estadual de venda e a Federal vinculada.

É nessa tela onde deixamos parametrizado se terá movimento de estoque ou
financeiro desssa operação apenas

5)NCM – Identificação do produto e vínculo de tributações
A NCM identifica o tipo do produto e define quais regras fiscais se aplicam.

## Página 4

Na tela da NCM, clique em 'Incluir tributação' e para cada operação (ex: Venda,
Devolução) selecione a Tributação Estadual correspondente.
Por que: o sistema usa o código NCM do produto e a operação fiscal escolhida
para determinar automaticamente quais impostos aplicar

Para editar ou incluir uma nova

## Página 5

6)Como tudo se conecta na prática
Exemplo: o produto com NCM 9706.90.00 tem vínculo com a operação 'Venda'
e usa a Tributação Estadual de venda, que por sua vez está ligada à Tributação
Federal com cálculo de IPI/PIS/COFINS.
Na emissão da nota, o sistema aplica automaticamente o CFOP 5.102, CST 102
e as alíquotas corretas de ICMS, IPI, PIS e COFINS.
Por que: esse vínculo garante notas fiscais corretas, sem precisar ajustar
impostos
Manualmente

7)Resumo
✔ Crie as operações fiscais (Venda, Compra, Devolução...)
✔ Cadastre a Tributação Federal conforme o enquadramento do cliente
✔ Cadastre a Tributação Estadual e vincule à Federal
✔ Cadastre a NCM e vincule Operações + Tributação Estadual
✔ Informe a NCM correta no produto
✔ Na nota, escolha a Operação fiscal – o sistema faz o resto automaticamente
