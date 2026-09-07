# Base de Conhecimento persistente

## Arquitetura anterior

Uploads eram gravados em `knowledge/uploads/`. A indexacao percorria toda a pasta `knowledge/` e salvava chunks e embeddings em `knowledge/.index/knowledge-index.json`. A tela administrativa, por sua vez, listava apenas `KnowledgeDocument` no PostgreSQL. Assim, a tela e o RAG podiam usar conjuntos diferentes de documentos, e os uploads e o indice eram perdidos em hosts com filesystem efemero.

## Arquitetura atual

Com `DATABASE_URL` configurada, o PostgreSQL e a fonte autoritativa:

- `KnowledgeDocument` guarda metadados, texto extraido, status, erro seguro, hash, origem e o binario (`bytea`) do upload;
- `KnowledgeChunk` guarda o texto de cada trecho, texto de busca, embedding JSONB e metadados;
- o RAG consulta somente documentos `READY` e seus chunks persistidos;
- novos uploads processam apenas seu proprio documento. Nenhum reindexamento global ocorre no request de upload.

Para o limite atual de 15 MB, armazenar o binario no Neon elimina a necessidade de credenciais externas e de disco persistente. Em uma futura necessidade de arquivos maiores, a interface de upload pode trocar `fileData` por uma chave de objeto de S3/R2 sem alterar chunks, status ou a consulta RAG.

## Base canônica legada

`knowledge/`, `knowledge/uploads/` e `knowledge/.index/` continuam preservados como fontes legadas locais. Eles nao sao lidos em runtime de producao com banco habilitado. Execute `npm run import:knowledge` em ambiente administrativo com acesso a essa pasta para importar/sincronizar a base canônica. O script usa `sourceKey` e hash para evitar duplicacao e nao reprocessa documentos inalterados.

O script historico `sync-knowledge.ts` continua disponivel somente para preparar a cópia local de migração; ele nao deve ser executado em runtime nem em um deploy de producao.

## Operacao

- Nenhuma variavel nova e obrigatoria alem de `DATABASE_URL` e `OPENAI_API_KEY` existentes.
- `pgvector` nao e requisito desta versao: embeddings sao persistidos em JSONB e comparados pela mesma logica de cosine similarity ja usada pelo projeto. Se a escala exigir busca vetorial SQL, habilite `pgvector` no Neon e migre a coluna `embedding` sem mudar o contrato de documentos/chunks.
- O upload requer `MANAGE_KNOWLEDGE`, aceita apenas TXT, MD, PDF, DOCX, CSV e XLSX de ate 15 MB, valida extensao/MIME, sanitiza o nome e nunca expoe caminho interno. Em deploys Vercel, o limite efetivo e 4 MB: a plataforma limita o corpo da Function a 4,5 MB. Para arquivos maiores, sera necessario adotar upload direto para armazenamento de objetos antes da Function.
