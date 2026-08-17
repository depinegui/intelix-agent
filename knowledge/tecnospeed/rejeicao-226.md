# Rejeicao 226

Fonte: TecnoSpeed
URL: https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360013317793-NF-e-Como-resolver-a-rejei%C3%A7%C3%A3o-226-C%C3%B3digo-da-UF-do-Emitente-diverge-da-UF-autorizadora

Problema:
A NF-e foi rejeitada porque o codigo da UF do emitente diverge da UF autorizadora.

Possivel causa:
O campo cUF informado no XML nao corresponde a UF da SEFAZ para a qual a nota esta sendo enviada. Em muitos casos, a configuracao de UF no ERP nao bate com a UF do XML.

Solucao:
Verifique o campo cUF no XML e confirme se ele corresponde exatamente a UF autorizadora da SEFAZ que esta recebendo a NF-e. Ajuste a configuracao do ERP ou do XML antes de reenviar.

