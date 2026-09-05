---
titulo: "Configuração PDV NFC-e"
categoria: "PDV"
fonte: "PDV/7fe36e0d-daef-42e5-a330-c804e0ea0488_Configurao_PDV_NFC-e.pdf"
arquivo_original: "7fe36e0d-daef-42e5-a330-c804e0ea0488_Configurao_PDV_NFC-e.pdf"
paginas: 6
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Configuração PDV NFC-e

## Página 1

1. Pegar base de dados atualizada do sistema retaguarda do cliente
(Comercial/Industrial) e certificado digital atualizado

2. Caso o cliente já possua pdv pegar a pasta "MsysPDV"

3. Dentro da base que foi pega no 1o passo selecionar todas as NCMs que são
utilizadas com o seguinte script:

SELECT
count(*),
TABELAS_NCM.TNC_NCM
FROM PRODUTOS
LEFT OUTER JOIN TABELAS_NCM ON ( PRODUTOS.PRO_NCM =
TABELAS_NCM.TNC_ID)
group by 2

4. Após exportar todas as NCMs para um arquivo .xls(Excel) seguir o passo a
passo do validador de NCMs salvo no link abaixo

Para exportar:

## Página 2

Validador:
https://drive.google.com/drive/folders/10IGl_HyXwxW18GnYcR9Paqg723LreM2X?
usp=sharing

5. Após realizar todos os passos do validador, ele vai gerar um novo arquivo
com todas as NCMs inválidas e utilizando o portal do Siscomex
(https://portalunico.siscomex.gov.br/classif/#/nomenclatura/) vai consultar e
substituir todas essas NCMs. E para substituir elas nos produtos que estão
sendo usadas, vai utilizar o seguinte script na base de dados do sistema
retaguarda:

UPDATE PRODUTOS
SET
PRODUTOS.PRO_NCM = (SELECT TABELAS_NCM.TNC_ID FROM TABELAS_NCM
WHERE TABELAS_NCM.TNC_NCM = '4421.91.00')
WHERE

## Página 3

PRODUTOS.PRO_NCM = (SELECT TABELAS_NCM.TNC_ID FROM TABELAS_NCM
WHERE TABELAS_NCM.TNC_NCM = '4421.90.00')

6. Agora, na base do MsysPDV antigo, irá exportar da forma que mostra abaixo
todos os dados das seguintes tabelas: PARAMETROS, EMPRESAS, USUARIOS
E USUARIO_PERMISSAO

7. Na base do novo MsysPDV irá acessar a tela de Script Executive e rodar (F9)
todos os scripts exportados no passo anterior

## Página 4

8. Para poder acessar o MsysPDV sem problemas é necessário ajustar os
diretórios das bases de dados do próprio e do sistema retaguarda no arquivo
“MsysPDV\Connection\DBConnection.properties”. Além de ajustar a base
do PDV, também, no “MsysPDV\microsys.ini”

9. Já dentro do MsysPDV NFC-e é necessário importar todos os dados para ele

## Página 5

10. Acessando as Configurações Gerais é necessário ajustar 3 telas:

Parâmetros: ajustar os campos da seguinte forma

Empresa

Ajustar todas as abas de informação. Lembrando que: Série e
Numeração das NFC-e’s é a contabilidade que passa

CSC é gerado pelo site do SAT internamente: deve-se ter o certificado do
cliente e CNPJ do mesmo. Antes de gerar verificar se o cadastro da
empresa está vinculado ao SAT da Microsys.

Mesmo que o cliente não tenha uma logo, na aba Info. Logo é necessário
colocar pelo menos um .png em branco

Financeiro

## Página 6

11. Após isso pode ser feita a emissão de uma NFC-e de teste

Se desejar emitir em Ambiente de Homologação é necessário gerar um CSC
de homologação também, assim como fazer a troca do MsysNFe.config para
esse mesmo ambiente
