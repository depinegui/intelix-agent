# Homologacao na Vercel

## 1. Preparar o repositorio

1. Revise as alteracoes, execute os testes locais e envie a branch para o GitHub.
2. Nao envie `.env`, `.env.local`, dumps ou arquivos de upload.
3. Nao execute `npm run db:seed` nem `npm run import:knowledge` durante o deploy.

## 2. Criar o projeto

1. Na Vercel, selecione **Add New > Project** e importe o repositorio GitHub.
2. Mantenha o framework como **Next.js** e o diretório raiz como `./`.
3. Use `npm ci` como Install Command e `npm run build` como Build Command.
4. Habilite as System Environment Variables para disponibilizar `VERCEL=1` em
   runtime. Isso ativa o limite seguro de upload da Vercel.

## 3. Configurar variaveis

Cadastre estas variaveis em **Preview** e **Production**, com valores distintos
quando os ambientes usarem bancos separados:

- `DATABASE_URL`: URL pooled do banco Neon, com TLS.
- `JWT_SECRET`: segredo aleatorio exclusivo, com no minimo 32 caracteres.
- `OPENAI_API_KEY`: chave do provedor de IA.
- `OPENAI_MODEL`: modelo permitido para o ambiente.
- `NEXT_PUBLIC_APP_URL`: URL HTTPS canonica do ambiente.

Nao configure `INTELIX_DEMO_PASSWORD` em Preview ou Production.

## 4. Aplicar banco com seguranca

Antes do primeiro deploy, em um terminal administrativo que tenha a
`DATABASE_URL` do ambiente alvo, execute:

```bash
npx prisma migrate deploy --schema database/schema.prisma
npx prisma migrate status --schema database/schema.prisma
```

O comando de build nao executa migrations. Nunca rode `db:seed` no banco de
homologacao, pois ele foi desenhado para limpar dados de demonstracao locais.

## 5. Primeiro deploy e verificacao

1. Publique primeiro uma Preview e confirme login, logout e bloqueio de rotas.
2. Crie contas de teste separadas para ADMIN, ANALYST e SPECIALIST.
3. Valide Auditoria, Base de Conhecimento, Chat, feedback, escalada e chamados.
4. Configure o dominio de homologacao, atualize `NEXT_PUBLIC_APP_URL` e faca um
   novo deploy.
5. Consulte os logs e a aba Functions para falhas de Prisma, processamento ou IA.

## Limites da plataforma

Vercel limita corpos de Functions a 4,5 MB. Por isso o Intelix aceita uploads
de ate 4 MB quando `VERCEL=1`; fora da Vercel o limite permanece 15 MB. Para
arquivos maiores, use upload direto para armazenamento de objetos antes de
enviar metadados para a aplicacao.

## Base canonica

Se a homologacao usar o mesmo banco Neon atual, os documentos e chunks ja
persistidos estarao disponiveis e `npm run import:knowledge` nao deve ser
executado novamente. Use a importacao apenas em banco novo/vazio ou ao incluir
arquivos legados locais; ela usa `sourceKey` e hash para evitar duplicacao.
