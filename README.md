# 🤖 Intelix Agent

**Agente autônomo de Inteligência Artificial para suporte técnico em sistemas de gestão empresarial (ERP).**

Projeto desenvolvido como Trabalho de Conclusão de Curso (TCC) do curso de **Ciência da Computação da Universidade do Oeste de Santa Catarina (Unoesc) — Campus São Miguel do Oeste**.

O Intelix Agent combina **Modelos de Linguagem de Grande Escala (LLMs)** com **Retrieval-Augmented Generation (RAG)** para compreender perguntas em linguagem natural, recuperar informações relevantes em uma base de conhecimento e gerar respostas contextualizadas para dúvidas relacionadas a sistemas ERP.

## 🎯 Objetivo

Desenvolver um protótipo de agente de Inteligência Artificial capaz de auxiliar usuários na resolução de dúvidas operacionais relacionadas a sistemas de gestão empresarial, reduzindo a dependência de atendimentos humanos para questões recorrentes.

## 🧠 Arquitetura

O fluxo principal do agente segue a seguinte estrutura:

```text
Usuário
   ↓
Interface Web
   ↓
API do Intelix Agent
   ↓
Recuperação de informações (RAG)
   ↓
Base de conhecimento indexada
   ↓
Trechos mais relevantes
   ↓
Modelo de Linguagem (LLM)
   ↓
Resposta contextualizada + fontes recuperadas
```

Antes de gerar uma resposta, o agente consulta a base de conhecimento indexada. Os conteúdos considerados mais relevantes são utilizados como contexto para o modelo de linguagem, permitindo respostas mais específicas e fundamentadas.

## 🛠️ Tecnologias

- **Next.js 15** — aplicação web e API
- **React 19** — interface do usuário
- **TypeScript** — desenvolvimento tipado
- **OpenAI SDK** — integração com modelos de linguagem e embeddings
- **RAG** — recuperação de informações da base de conhecimento
- **Prisma** — camada de acesso a dados
- **PostgreSQL** — persistência opcional
- **Tailwind CSS** — estilização da interface
- **Zod** — validação de dados

## 📚 Base de conhecimento

Os documentos utilizados pelo agente ficam no diretório:

```text
knowledge/
```

Formatos suportados:

- `.txt`
- `.md`
- `.pdf`
- `.docx`
- `.csv`
- `.xlsx`

O repositório inclui material de exemplo relacionado à **rejeição 204 da NF-e**, utilizado para validar o fluxo de recuperação de informações.

## 🔎 Indexação da base

Para gerar ou atualizar o índice utilizado pelo RAG:

```bash
npm run index:knowledge
```

O processo:

1. lê os arquivos disponíveis em `knowledge/`;
2. extrai o conteúdo textual;
3. divide o conteúdo em trechos menores;
4. gera embeddings;
5. cria o índice utilizado na recuperação semântica.

O índice local é armazenado em `knowledge/.index/` e não é versionado pelo Git.

## 🚀 Executando o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/depinegui/intelix-agent.git
cd intelix-agent
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
DATABASE_URL=
```

> Nunca envie chaves de API, senhas ou outras credenciais para o repositório.

O `DATABASE_URL` pode permanecer vazio para execução no modo de demonstração. Para utilizar persistência em PostgreSQL, configure uma URL válida para o banco de dados.

### 4. Indexe a base de conhecimento

```bash
npm run index:knowledge
```

### 5. Inicie a aplicação

```bash
npm run dev
```

Por padrão, a aplicação fica disponível em:

```text
http://localhost:3000
```

## 💬 Testando o agente

Após iniciar a aplicação, acesse a interface e faça uma pergunta relacionada ao conteúdo disponível na base de conhecimento. Exemplo:

```text
Como resolver a rejeição 204 da NF-e?
```

O fluxo executado é:

1. o frontend envia a pergunta para `POST /api/agent/chat`;
2. o backend recupera os trechos mais relevantes da base indexada;
3. os trechos são fornecidos como contexto ao modelo de linguagem;
4. o agente gera uma resposta fundamentada;
5. a interface apresenta a resposta juntamente com as fontes recuperadas.

Caso a base não possua informações suficientes, o agente informa que não encontrou conteúdo suficiente para responder com segurança.

## 🔌 Endpoint principal

```http
POST /api/agent/chat
Content-Type: application/json
```

Exemplo de requisição:

```json
{
  "message": "Como resolver a rejeição 204 da NF-e?"
}
```

## 🗄️ PostgreSQL

Para executar utilizando PostgreSQL:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

O projeto também pode ser executado em modo de demonstração sem banco de dados.

## ✅ Validação

Comandos disponíveis para verificar a qualidade e compilação do projeto:

```bash
npm run lint
npm run typecheck
npm run build
```

## 🔐 Segurança e privacidade

- arquivos `.env` não são versionados;
- chaves de API permanecem exclusivamente nas variáveis de ambiente;
- o índice local da base de conhecimento não é enviado ao Git;
- dados pessoais e informações reais de clientes não devem ser adicionados à base pública;
- recomenda-se anonimizar documentos antes da indexação quando houver informações sensíveis.

## 🔮 Evolução do projeto

Entre as possibilidades de evolução estão:

- ampliação da base de conhecimento;
- aprimoramento da interface administrativa;
- gestão e visualização das fontes recuperadas;
- melhorias no indicador de confiança das respostas;
- novos mecanismos de reindexação;
- testes em um ambiente mais próximo da utilização real;
- evolução do armazenamento vetorial para soluções como PostgreSQL com `pgvector`.

## 🎓 Contexto acadêmico

**Curso:** Bacharelado em Ciência da Computação  
**Instituição:** Universidade do Oeste de Santa Catarina — Unoesc  
**Campus:** São Miguel do Oeste — SC  
**Projeto:** Intelix Agent  
**Autores:** Guilherme Depiné Neto e Maria Cecília Schneider de Oliveira  
**Orientação:** Me. Franciele Carla Petry

---

<p align="center">
  Desenvolvido como Trabalho de Conclusão de Curso em Ciência da Computação.
</p>
