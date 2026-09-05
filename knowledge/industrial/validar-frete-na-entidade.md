---
titulo: "Validar Frete na Entidade"
categoria: "Industrial"
fonte: "Industrial/92900f65-1acf-4f66-a807-dde4994edddc_Validar_Frete_na_Entidade.pdf"
arquivo_original: "92900f65-1acf-4f66-a807-dde4994edddc_Validar_Frete_na_Entidade.pdf"
paginas: 2
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Validar Frete na Entidade

## Página 1

Valor de frete específico por cliente ...

Migration para criar um campo onde valida o percentual de frete do cliente.

Por padrão é nulo.

Na tela de clientes adicionado o campo para indicar se vai validar ou não o
percentual de frete do cliente.

Na importação dos pedidos Web, validado por esse campo. Se cliente estiver
marcado vai importar com o percentual de frete do cadastro do cliente, se
estiver desmarcado irá pegar o percentual de frete do cadastro do
representante.

E ao fazer o pedido manual também irá validar esse parâmetro no cadastro do
cliente, isso se o parâmetro "Calculo Frete Automático " estiver marcado como
SIM.
