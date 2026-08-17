# Intelix Agent

Prototipo de TCC para suporte em ERP com Next.js 15, TypeScript, App Router, Prisma e integracao com OpenAI via RAG.

## Stack

- Next.js 15
- React 19
- TypeScript
- Prisma
- PostgreSQL opcional
- OpenAI SDK
- Indexacao local com embeddings

## Configuracao do ambiente

Crie um arquivo `.env` na raiz do projeto com este formato:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
DATABASE_URL=
```

Observacoes:

- A `OPENAI_API_KEY` deve ficar somente no `.env`.
- O projeto ja ignora `.env` no Git.
- `DATABASE_URL` pode ficar vazio para rodar em modo demo, sem banco.
- Se quiser usar banco real, informe a URL do PostgreSQL e rode os comandos do Prisma.

## Base de conhecimento

Os documentos consultados pelo agente ficam em `./knowledge`.

Formatos suportados:

- `.txt`
- `.md`
- `.pdf`
- `.docx`
- `.csv`
- `.xlsx`

Fluxo recomendado:

1. Coloque os arquivos na pasta `knowledge`.
2. Rode a indexacao.
3. Inicie a aplicacao.
4. Faca perguntas no chat.

Existe um documento de exemplo em `knowledge/nfe-rejeicao-204.md` para validar o fluxo inicial.

## Indexacao da base

Para gerar ou atualizar o indice vetorial local:

```bash
npm run index:knowledge
```

O comando:

- le os arquivos da pasta `knowledge`
- extrai o texto
- divide o conteudo em trechos menores
- gera embeddings com a OpenAI
- salva o indice local em `knowledge/.index/knowledge-index.json`

Ao final, o terminal mostra:

- quantos arquivos foram processados
- quantos trechos foram indexados

## Execucao da aplicacao

Instale as dependencias:

```bash
npm install
```

Rode em modo desenvolvimento:

```bash
npm run dev
```

O projeto funciona sem banco usando a store demo. Para usar PostgreSQL real:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Como testar o agente

1. Entre no sistema com o usuario demo:

- Email: `analista@intelix.ai`
- CNPJ: `12.345.678/0001-99`
- Senha: `Intelix@2026`

2. Acesse `/chat-ia`.
3. Faca uma pergunta como:

```text
Como resolver a rejeicao 204 da NF-e?
```

4. O frontend envia a mensagem para `POST /api/agent/chat`.
5. O backend busca os trechos mais relevantes da base indexada e consulta a OpenAI.
6. A resposta aparece no chat com as fontes recuperadas.

Se a base nao tiver dados suficientes, o agente responde que nao encontrou informacao suficiente com seguranca.

## Como testar o endpoint

O endpoint principal do agente e:

```http
POST /api/agent/chat
Content-Type: application/json
```

Body minimo:

```json
{
  "message": "Como resolver a rejeicao 204 da NF-e?"
}
```

Se voce ja estiver autenticado pela interface, o proprio chat usa esse endpoint.

## Validacoes de qualidade

```bash
npm run lint
npm run typecheck
npm run build
```

## Seguranca e LGPD

- O projeto evita registrar a `OPENAI_API_KEY` em codigo e no Git.
- As mensagens persistidas no chat passam por redacao de e-mail, CPF, CNPJ, telefone e chave de NF-e.
- Evite colocar dados reais de clientes na pasta `knowledge`.
- Recomenda-se anonimizar ou remover nomes de clientes, CNPJ, CPF, e-mails, telefones e outros dados sensiveis antes de indexar novos documentos.

## Evolucao futura

O indice vetorial atual e local em arquivo para simplificar a execucao do TCC. A estrutura foi separada para facilitar a migracao futura para PostgreSQL com `pgvector`, sem mudar o fluxo do frontend ou do endpoint do agente.
