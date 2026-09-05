---
titulo: "Manual Legal de Como Configurar 🤠👍BackOffice"
categoria: "Industrial"
fonte: "Industrial/Manual_Legal_de_Como_Configurar_BackOffice_.pdf"
arquivo_original: "Manual_Legal_de_Como_Configurar_BackOffice_.pdf"
paginas: 6
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Manual Legal de Como Configurar 🤠👍BackOffice

## Página 1

Pré-Requisitos

1. Descobrir qual é o IP Fixo (Caso o cliente tenha, caso não tiver é necessário adquirir)

2. Criar um regra no firewall para liberar o acesso externo quando for feita uma requisição no IP
externo caindo no IP interno na porta 9002.

2.1 Ao fazer a consulta no site https://www.testeportas.com.br com o IP e a Porta. Deve dar
a mensagem como Aberta

3. Instalar Java

O java deve estar na versão 17. Ao realizar uma consulta no CMD com o

comando “java –-version” deve aparecer a seguinte tela:

## Página 2

4. Descobrir qual é o IP interno do cliente (ou seja qual é o IP que utilizamos para acessar a
base). Esse IP pode ser descoberto com o comando “ipconfig” no cmd. Nesse caso é 192.168.0.5

5. Solicitar liberação no intra

IP Externo: http://”IpExterno”:9002

IP Interno: http://”IpInterno”:9002

Exemplo:

IP Externo: http://187.45.100.111:9002/

## Página 3

IP Interno: http://192.168.0.5:9002/

6. Pegar a versão da API no 8 (\\192.168.0.8\Versoes\MsysBackoffice\API) pegar o arquivo zipado e
deszipar na raiz (C:\Microsy\Backoffice) e executar como ADM

o arquivo “Backoffice-API-3.22.0-Install-1.2.0.2-Build-2.exe”

Outras configurações

Conferir se esse NET FRAMEWORK 3.5 está instalado, caso não esteja você vai em Funções
do Servidor para instalar

## Página 6

Verificar se o serviço está on. Abrir no navegador o seguinte
link: http://localhost:9002/msysbackoffice/api/actuator/health
