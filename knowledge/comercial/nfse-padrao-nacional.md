---
titulo: "NFSe Padrao Nacional"
categoria: "Comercial"
fonte: "Comercial/3c80cad5-1620-4873-9e11-ecd109147228_NFSe_Padrao_Nacional_.pdf"
arquivo_original: "3c80cad5-1620-4873-9e11-ecd109147228_NFSe_Padrao_Nacional_.pdf"
paginas: 3
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# NFSe Padrao Nacional

## Página 1

Emissão de notas de serviço pelo ambiente nacional

Para realizar a emissão de notas de serviço (NFSe) no ambiente nacional, é
necessário realizar algumas configurações no sistema comercial,
especialmente no cadastro de filiais.

Cadastro da Filial

No cadastro da filial, acesse a aba NFSe e configure os seguintes campos:

Layout NFSe: Selecione a opção “Padrão Nacional”;

Código do serviço: Agora deve conter 6 caracteres. Exemplo: 010401;

Configuração tario”;

## Página 2

Componente de impressão: deve ser “FastReport” na pasta
sistema

No diretório do sistema na pasta NFSe, em seguida configuração e por fim
MsysNFSe. Dentro desse arquivo, verifique os seguintes parâmetros:

Modo de envio: deve ser “meUnitario”.

// Configura o componente que fará a impressão do DANFSE 1-FastReport 2-
FortesReport
NFSe.Impressao.Componente=1
//Configura a forma de emissão (meAutomatico, meLoteAssincrono,
meLoteSincrono, meUnitario, meTeste)
NFSe.ModoEnvio=meUnitario

No cadastro do tipo de serviço ira conter o campo do NBS, esse será preciso
preencher conforme tabela padrão do NBS.

Com todas essas configurações concluidas, o sistema estará pronto para emitir
notas de serviço no padrão nacional.
