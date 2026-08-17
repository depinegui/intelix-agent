# Rejeicao 630

Fonte: TecnoSpeed
URL: https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360010786014-NF-e-NFC-e-Como-resolver-a-Rejei%C3%A7%C3%A3o-630-Valor-do-Produto-difere-do-produto-Valor-Unit%C3%A1rio-de-Tributa%C3%A7%C3%A3o-e-Quantidade-Tribut%C3%A1vel

Problema:
A NF-e foi rejeitada porque o valor do produto diverge do valor unitario de tributacao multiplicado pela quantidade tributavel.

Possivel causa:
O campo vProd foi informado com valor diferente do resultado de vUnTrib x qTrib.

Solucao:
Recalcule o valor do produto usando exatamente a multiplicacao entre valor unitario tributavel e quantidade tributavel. Ajuste os campos fiscais do item e gere um novo XML consistente.

