# Rejeicao 316

Fonte: TecnoSpeed
URL: https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360010923474-NF-e-Como-resolver-a-Rejei%C3%A7%C3%A3o-316-Nota-Fiscal-referenciada-com-a-mesma-Chave-de-Acesso-da-Nota-Fiscal-atual

Problema:
A NF-e foi rejeitada porque a nota referenciada usa a mesma chave de acesso da nota atual.

Possivel causa:
O campo de NF-e referenciada recebeu a propria chave da nota em emissao, quando deveria apontar para outro documento fiscal.

Solucao:
Revise a chave informada na referencia da nota e garanta que ela seja diferente da chave da NF-e atual. Corrija o campo de nota referenciada e gere novo XML antes do envio.

