# Segurança e homologação

## Variáveis obrigatórias em produção

- `DATABASE_URL`: conexão PostgreSQL com TLS quando aplicável.
- `JWT_SECRET`: segredo aleatório exclusivo, com pelo menos 32 caracteres.
- `OPENAI_API_KEY`: necessário para o recurso de IA.
- `NEXT_PUBLIC_APP_URL`: URL canônica da aplicação.

O processo de produção falha ao iniciar se `DATABASE_URL`, `JWT_SECRET` ou
`OPENAI_API_KEY` estiverem ausentes. Não reutilize segredos entre ambientes.

## Antes do deploy

1. Rotacione toda credencial que já tenha sido exposta, inclusive credenciais
   históricas de demonstração e chaves de serviços.
2. Execute `npx prisma migrate deploy --schema database/schema.prisma`.
3. Crie o primeiro administrador por procedimento controlado e confirme que
   contas administrativas não são alteradas pela gestão comum de usuários.
4. Verifique o acesso de ADMIN à Auditoria e a negação para ANALYST e SPECIALIST.
5. Confirme HTTPS, cookies `Secure` e a configuração de domínio do ambiente.

## Segredos e dados locais

Nunca versione `.env`, `.env.local`, chaves, tokens, dumps de banco ou uploads.
Use `.env.example` somente como modelo. O modo demo/seed exige
`INTELIX_DEMO_PASSWORD` local; o seed é bloqueado em produção e remove dados do
banco de destino, portanto não deve ser usado em homologação com dados reais.

## Limites atuais

Uploads administrativos aceitam TXT, MD, PDF, DOCX, CSV e XLSX até 15 MB,
validam extensão, MIME e assinatura básica quando aplicável, e ficam no banco
sem rota pública de download. A recuperação de senha está deliberadamente
desativada enquanto não houver entrega de token por canal confiável.
