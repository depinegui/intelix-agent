---
titulo: "Força de Vendas - Backoffice"
categoria: "Industrial"
fonte: "Industrial/a01f044a-322b-4c48-ada8-08eed509d3b9_Fora_de_Vendas_-_Backoffice.pdf"
arquivo_original: "a01f044a-322b-4c48-ada8-08eed509d3b9_Fora_de_Vendas_-_Backoffice.pdf"
paginas: 10
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Força de Vendas - Backoffice

## Página 1

Instalar API

Trabalha como serviço

Porta padrao 9002

Precisa IP Publico para usar o Força de Vendas

CMD: java-version

Para ver se tem algum Java instalado.

Se não puder excluir o Java que já tem, criar outra pastinha onde ficará o Java
11

Na pesquisa:

Editar variaveis de ambiente

Criar em "Novo"

JAVA_HOME

Achar o caminho da pasta do Java 11

Pasta BIN

Java - Versão 11 - No 08 tem a versão

(Versoes - MsysBackOffice)

(Para instalar - Next e Finish)

Pastinha API

(Dentro da Pasta Microsys, criar pasta Backoffice)

## Página 2

No 08, dentro da pasta Backoffice, pegar dentro da pasta a ultima API

Extrair ela dentro da pasta criada no computador do cliente

application.properties (é como se fosse o INI do Industrial)

ERP Configurations: Colocar se é Comercial ou Industrial

DATABASE CONFIGURATION

STORAGE CONFIGURATION

Configurar separado:

IP da máquina

Porta: 3050

Caminho dos arquivos

Na pasta do BackOffice, API:

Serviceinstall

Só executar para instalar o Serviço

As vezes precisa instalar Recuros do Windows, pode-se fazer a instalação
normalmente

Acessar no Google:

192.168.0.7:9009

Mesmo caminho para todos os clientes

Colocar IP FIXO na maquina ...

## Página 3

Com botão direito do Mouse ...
Configurações de Rede de Internet
Mais opções do Adaptador
Protocolo IP Versão 4
Propriedades:
Tem que configurar no Wi-Fi e no Cabo de Rede:
Endereço IP: Preencher com o IP do Cliente (Usar sempre abaixo de 100,
porque a faixa que usualmente usam é da 100 até a 200, assim ninguem corre
o risco de usar o IP do Servidor)
Precisa alterar o endereço do INI, para esse que eu configurei

## Página 4

Geteway, no ultimo campo, sempre colocar o 1 ou o 254

## Página 5

Usar essa acima como padrão, só ajustando o endereço de IP

INICIAR O SERVIÇO:

Dentro desse arquivo que gera na pasta do Backoffice, aparece os erros que
dão no sistema ...

## Página 6

Dentro desse ícone ...

Se não der certo o Java, pode-se colocar o caminho dele ...
Achar na pasta do Java correto, o “java.exe”

Sempre que instalar o Backoffice, ver a versão do Sitema Comercial ou
Industrial.
Deixar sempre mais atualziado, em versões muito antigas pode ser que não
funcione

## Página 7

Se precisar alterar a Porta ...
Sempre repassar para a Adri também a nova Porta

Esse é o documento que mais vamos usar, mostra o histórico ...

Sempre com barra dupla ...

## Página 8

Quando aparecer esse Started é porque deu certo ..

Precisa liberar o INTRA agora
Precisa ver direcionamento de Porta, se tem IP Publico, isso é com o TI da
empresa.
No Google e escrever meu IP, esse IP passar para o TI que precisa ser na porta
que você utilizou.
Cadastro de Usuário:

## Página 9

ATUALIZAR:

Parar o Serviço
No 08, pegar o arquivo BackOfficeAplication e substituir

Pode deletar, e reiniciar o Serviço para refazer essas Migrations

OBRIGATORIO TRABALHAR COM TABELA DE PREÇO
OBRIGATORIO NO CADASTRO DO USUARIO, FILIAL PADRAO PRECISA SER

## Página 10

UMA FISCAL
