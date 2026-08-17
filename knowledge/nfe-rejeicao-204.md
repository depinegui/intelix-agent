# Rejeicao 204 da NF-e

## Visao geral

A rejeicao 204 indica duplicidade de NF-e. Isso acontece quando a SEFAZ ja possui uma NF-e autorizada com a mesma chave de acesso da nota que esta sendo transmitida novamente.

## Problema

- Ao enviar a NF-e, o sistema retorna a mensagem "Rejeicao 204 - Duplicidade de NF-e".

## Possivel causa

- A nota ja foi autorizada anteriormente e o ERP tentou retransmiti-la.
- A numeracao, serie e chave de acesso foram reutilizadas por engano.
- Houve falha de comunicacao no retorno anterior e o usuario reenviou a mesma nota sem consultar o status.

## Solucao

1. Consultar a chave da NF-e na SEFAZ para confirmar se ela ja foi autorizada.
2. Verificar no ERP se a nota ja esta registrada como autorizada ou pendente de sincronizacao.
3. Se a NF-e correta ja estiver autorizada, nao retransmitir a mesma chave.
4. Se a emissao tiver sido feita por engano, cancelar a NF-e autorizada antes de gerar uma nova nota, quando a regra fiscal permitir.
5. Quando for necessario emitir novamente, gerar uma nova NF-e com numeracao e chave diferentes.

## Procedimento recomendado no ERP

1. Abrir a rotina de consulta de NF-e e localizar a nota pelo numero, serie e chave.
2. Conferir o protocolo de autorizacao e o status retornado pela SEFAZ.
3. Atualizar o status da nota no sistema caso exista apenas divergencia de sincronizacao.
4. Emitir uma nova nota somente depois de corrigir a numeracao para evitar nova duplicidade.
