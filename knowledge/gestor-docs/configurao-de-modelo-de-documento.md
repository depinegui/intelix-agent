---
titulo: "Configuração de Modelo de Documento"
categoria: "Gestor-Docs"
fonte: "Gestor-Docs/7234f266-0d14-4235-85cd-db8b8ac6c439_Configurao_de_Modelo_de_Documento.pdf"
arquivo_original: "7234f266-0d14-4235-85cd-db8b8ac6c439_Configurao_de_Modelo_de_Documento.pdf"
paginas: 7
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Configuração de Modelo de Documento

## Página 1

Configuração de Modelos de Documento no MSYS
Docs Digitais

Para que consiga configurar os modelos dos seus documentos com maior
autonomia siga os passos abaixo.

1. Em um documento próprio encontre todas as informações que são
variáveis, ou seja, que mudam de contrato para contrato.

Ao encontrá-las, crie uma variável para cada uma das informações na seguinte
estrutura: ${IndentificacaoVariavel}, como também é mostrado abaixo.

## Página 2

2. Após tudo que for variável ter sido ajustado como foi mostrado acima,
acesse a tela de cadastro de modelos em Cadastros > Modelos de
Documento importe o seu arquivo .DOCX como mostra na tela do sistema,
contendo no máximo 25 MB.

3. Ao importar, o sistema irá reconhecer todas as variáveis criadas que
estiverem dentro do padrão mostrado no Passo 1, sendo trazidas em ordem
alfabética, como mostra abaixo.

## Página 3

4. Agora será necessário configurar todos esses campos dentro do seu
documento com quais tipos de informação serão e de onde elas serão
puxadas.

4.1. Para o campo Origem dos dados: temos as opções padrão abaixo

E, baseado na sua escolha, as opções da Informação alterará. Então, caso
seja selecionada a opção de DOCUMENTO, terá disponível: Data,
Identificação e Observações.

Caso a opção seja a de PESSOA, terá disponível todas as informações do
cadastro da pessoa selecionada no Contrato como: Código, Nome,
CPF/CNPJ, Bairro, Logradouro, Data de Nascimento, etc...

Caso a opção seja a de PRODUTO, terá disponível: Código, Referência,
Nome, Preço, Observações.

E, na última opção de PERSONALIZADO, todos os tipos de informações são
editáveis na hora da criação do Contrato, pois existe uma tela específica
dos campos personalizados.

4.2. Caso seja selecionado um ou mais Signatários padrão no modelo de
documento, os dados da pessoa também estarão disponíveis para serem
utilizados nas variáveis definidas.

As informações deles serão exatamente iguais às da PESSOA, puxando todos
os dados de dentro do cadastro do Signatário.

## Página 4

4.3. Para as origens do tipo PERSONALIZADO, todo tipo de informação terá um
ícone de lápis ao lado para que seja possível definir qual nome você dará a
esse campo dentro do Contrato para que seja preenchido, tendo como tipo:
Inteiro, Texto, Texto longo, Data, Hora, Monetário, Sim ou Não e Opções, como
mostra abaixo

## Página 5

4.3.1. Para as informações do tipo OPÇÕES, você poderá configurar diversas
opções para serem apenas selecionadas na montagem do contrato, como o
caso do mês, onde serão trazidos todos os meses do ano apenas para serem
escolhidos na hora, sem que precise ser digitado todas as vezes, da seguinte
forma

## Página 6

Podendo também possuir um valor padrão, onde, baseado nele, o campo já
será preenchido de forma automática no Contrato.

5. Após todas as variáveis terem sido ajustadas dentro do modelo, basta
salvar o seu registro com um nome de identificação para que possa utilizar
o seu novo modelo de documento.

6. Quando acessar a tela de assinaturas em Documentos > Assinatura e
iniciar uma nova, terá o campo para selecionar o modelo criado e, caso ele
já possua Signatários padrão, como foi feito o exemplo acima, ao escolher
o modelo desejado esses participantes já serão trazidos automaticamente,
precisando apenas selecionar as pessoas que farão os papéis escolhidos.

## Página 7

7. Como comentado anteriormente, na tela de contratos temos uma aba
específica para as informações do tipo PERSONALIZADO.

Ali serão preenchidas as informações e, baseado no que foi configurado no
exemplo:

Ano do Contrato: Informação do tipo OPÇÕES, onde a padrão é o ano de
2026;

Dia do Contrato: Informação do tipo INTEIRO, onde são aceitos apenas
números inteiros;

Mês do Contrato: Informação do tipo OPÇÕES, tendo disponível todos os
meses para serem selecionados;

Valor do Contrato: Informação do tipo MONETÁRIO, com o valor sendo
impresso no documento depois no formato R$XX,XX
