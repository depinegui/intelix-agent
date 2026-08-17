# Rejeicao 656

Fonte: TecnoSpeed
URL: https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360015610154-NF-e-Como-resolver-a-Rejei%C3%A7%C3%A3o-656-Consumo-indevido

Problema:
A NF-e retornou rejeicao por consumo indevido.

Possivel causa:
O sistema emissor excedeu o limite de requisicoes por hora para um Web Service da SEFAZ, geralmente por consultas em loop, excesso de tentativas seguidas ou repeticao de operacoes como inutilizacao com muitas rejeicoes iguais.

Solucao:
Interrompa as tentativas em excesso, aguarde a liberacao pela SEFAZ e revise o fluxo de consultas para respeitar os intervalos e limites do Web Service. Quando necessario, ajuste a logica de controle para evitar repeticoes automaticas sem espera.

