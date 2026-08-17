# Relatorio de indexacao do XLSX

Arquivo analisado: `knowledge/treinamento_ia_v.01.xlsx`  
Planilha: `ATN1 - MSYS GESTOR`

## Resumo

- Total de registros encontrados: `31`
- Registros que entraram no indice: `17`
- Registros que ficaram de fora: `14`
- Regra atual de indexacao do XLSX: uma linha so entra no indice quando possui `Pergunta Principal` e `Resposta`
- Observacao importante: varios registros indexados ainda estao com metadados incompletos. Isso nao impede a indexacao, mas reduz a qualidade de recuperacao contextual.

## Criterio usado nesta analise

- `Indexado`: linha com `Pergunta Principal` preenchida e `Resposta` preenchida
- `Excluido`: linha com `Resposta` vazia, mesmo que a pergunta exista
- Campos considerados incompletos nesta planilha:
  - `Variações da Pergunta`
  - `Tópico/Categoria`
  - `Intenção do Usuário`
  - `Software`
  - `Fonte da Informação`
  - `Status (Revisado/Aprovado)`
  - `Observações/Notas`

## Registros do XLSX que entraram no indice

| Linha | Pergunta Principal | Entrou no indice | Campos vazios ou incompletos |
| --- | --- | --- | --- |
| 2 | Pode me informar como está o andamento/status da tarefa? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |
| 3 | Como faço para emitir boleto no sistema? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |
| 4 | Como faço para começar a emitir boleto no sistema? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Software`, `Fonte da Informação`, `Status (Revisado/Aprovado)`, `Observações/Notas` |
| 5 | Você poderia verificar por que estou com problemas para emitir boleto no sistema? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |
| 6 | Você pode me ajudar a cadastrar um produto? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |
| 7 | Você pode me ajudar a cadastrar um cliente/fornecedor/transportador? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |
| 8 | Você pode me ajudar a instalar o Certificado Digital? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |
| 9 | Como faço para dar entrada em uma nota por XML? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |
| 10 | Como faço para dar entrada em uma nota sem XML? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Software`, `Fonte da Informação`, `Status (Revisado/Aprovado)`, `Observações/Notas` |
| 11 | Poderia me orientar sobre como configurar um novo usuário? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |
| 12 | Poderia me orientar sobre como excluir/inativar um usuário? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |
| 13 | Qual é o procedimento para configurar a tributação? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |
| 14 | Preciso de ajuda para lançar um contas a receber, o que devo fazer? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Software`, `Fonte da Informação`, `Status (Revisado/Aprovado)`, `Observações/Notas` |
| 15 | Preciso de ajuda para lançar um contas a pagar, o que devo fazer? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Software`, `Fonte da Informação`, `Status (Revisado/Aprovado)`, `Observações/Notas` |
| 16 | Como faço para reparcelar um título do Contas a Receber? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Software`, `Fonte da Informação`, `Status (Revisado/Aprovado)`, `Observações/Notas` |
| 17 | Como faço para reparcelar um título do Contas a Pagar? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Software`, `Fonte da Informação`, `Status (Revisado/Aprovado)`, `Observações/Notas` |
| 18 | Você pode me ajudar com um erro que está ocorrendo no sistema? | Sim | `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` |

## Registros do XLSX que ficaram de fora

| Linha | Pergunta Principal | Motivo da exclusao | Campos vazios ou incompletos | Sugestao para que possa ser indexado |
| --- | --- | --- | --- | --- |
| 19 | Configurar Etiqueta | `Resposta` vazia. Pela regra atual, sem resposta a linha nao vira conhecimento utilizavel. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Preencher uma resposta operacional passo a passo, adicionar 2 a 5 variacoes de pergunta, informar categoria e fonte da informacao. |
| 20 | Dúvidas sobre Implantação Sistema | `Resposta` vazia. A linha tem apenas o assunto, mas nao tem conteudo consultavel. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Preencher uma resposta objetiva sobre implantacao, indicar a intencao do usuario e incluir exemplos de perguntas equivalentes. |
| 21 | Liberar PAF (PDV / NFC-e) | `Resposta` vazia. Nao existe procedimento indexavel ainda. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Descrever o procedimento de liberacao do PAF, informar categoria fiscal ou PDV e adicionar variacoes como `liberar PAF`, `ativar NFC-e`, `configurar PDV`. |
| 22 | Ajuda para emitir MDF-e | `Resposta` vazia. A pergunta existe, mas sem solucao ou procedimento. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Preencher o fluxo de emissao do MDF-e, requisitos e erros comuns. Adicionar categoria e variacoes da pergunta. |
| 23 | Emissão NFC-e | `Resposta` vazia. O tema esta cadastrado, mas sem conhecimento principal. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Incluir passo a passo de emissao da NFC-e, parametros obrigatorios, categoria e fonte. |
| 24 | Emissão NFS-e | `Resposta` vazia. Sem resposta, a linha nao representa um chunk de conhecimento. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Escrever o procedimento de emissao da NFS-e e adicionar variacoes como `emitir nota de servico`, `gerar NFS-e`, `nota fiscal de servico`. |
| 25 | Emitir Nota Fiscal | `Resposta` vazia. O topico e relevante, mas ainda nao possui conteudo para RAG. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Preencher a resposta principal com o processo de emissao, regras basicas, menu do sistema e variacoes de pergunta. |
| 26 | Gerar Pedido de Venda | `Resposta` vazia. Falta o procedimento que o agente deveria retornar. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Adicionar resposta com o fluxo de geracao do pedido, campos obrigatorios, categoria comercial e variacoes de busca. |
| 27 | Problemas/Dúvidas estoque | `Resposta` vazia. O registro esta muito amplo e sem instrucao concreta. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Quebrar em perguntas mais especificas de estoque ou preencher uma resposta base com os problemas mais frequentes. |
| 28 | Relatórios | `Resposta` vazia. O registro esta apenas como assunto. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Informar quais relatorios existem, como acessar e como filtrar. Adicionar variacoes e categoria. |
| 29 | Sped Fiscal | `Resposta` vazia. Falta conteudo operacional ou orientacao. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Preencher com o fluxo do SPED Fiscal, validacoes, exportacao e erros comuns. |
| 30 | Tabelas de Preço | `Resposta` vazia. Sem resposta, o topico nao entra no indice. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Adicionar o procedimento para criar, editar e aplicar tabelas de preco, com variacoes de pergunta e categoria. |
| 31 | Treinamento | `Resposta` vazia. O tema existe, mas sem orientacao pronta para o agente. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Fonte da Informação`, `Observações/Notas` | Preencher com como solicitar treinamento, tipos disponiveis e o fluxo operacional correspondente. |
| 32 | Ajuda com Docs digitais | `Resposta` vazia. Alem da resposta, tambem faltam metadados basicos. | `Resposta`, `Variações da Pergunta`, `Tópico/Categoria`, `Intenção do Usuário`, `Software`, `Fonte da Informação`, `Status (Revisado/Aprovado)`, `Observações/Notas` | Primeiro preencher a resposta principal. Depois completar software, fonte e status. Tambem vale incluir variacoes como `documentos digitais`, `docs digitais`, `armazenar XML`, `consultar documentos`. |

## Recomendacoes praticas

1. Prioridade maxima: preencher a coluna `Resposta` das 14 linhas excluidas. Essa e a condicao minima para que elas passem a ser indexadas.
2. Prioridade alta: preencher `Variações da Pergunta` nas 31 linhas. Esse campo melhora bastante a recuperacao sem alterar o chat.
3. Prioridade alta: preencher `Tópico/Categoria` e `Fonte da Informação` para facilitar classificacao e rastreabilidade.
4. Prioridade media: preencher `Intenção do Usuário` para diferenciar perguntas informativas, operacionais e de erro.
5. Prioridade media: revisar respostas muito genericas como `por favor, qual seria a sua dúvida?` quando o objetivo for conhecimento consultavel pelo agente, porque elas entram no indice, mas agregam pouco valor para RAG.

## Conclusao

O principal fator que impediu a indexacao das 14 linhas foi a ausencia de `Resposta`. Hoje o XLSX ja esta melhor aproveitado do que antes, porque cada linha valida gera um registro estruturado e as futuras `Variações da Pergunta` entram diretamente no mecanismo de recuperacao.
