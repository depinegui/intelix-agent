---
titulo: "Backup Restore"
categoria: "PDV"
fonte: "PDV/b3f79a9d-0cec-4c47-914d-da0b9c8ab93a_Backup_Restore.pdf"
arquivo_original: "b3f79a9d-0cec-4c47-914d-da0b9c8ab93a_Backup_Restore.pdf"
paginas: 1
tipo: "manual_pdf"
qualidade_extracao: "ok"
caracteres_problematicos: 0
---

# Backup Restore

## Página 1

1 - Fazer uma cópia da base corrompida e colocar na pasta de backup de
dados.

2 - Fazer uma cópia da base corrompida e colocá-la na pasta bin do Firebird.
(C:\PROGRAM FILES\FIREBIRD\FIREBIRD_2_5\BIN)

3 - Caso a base ainda esteja acessível, renomeie-a para impedir o acesso
durante o processo de recuperação.

4 - Executar o CMD como administrador e rodar os seguintes comandos:

cd..
cd c:\\program files\\firebird\\firebird_2_5\\bin
set isc_user=sysdba
set isc_password=masterkey
gfix -validate -full msysdados.fdb
gfix -mend -full -ignore msysdados.fdb
gbak.exe -v -t -ignore -garbage -limbo -user sysdba -password masterkey msysdados.fd
b msysdados.fbk
gbak.exe -c -v -fix_fss_metadata win1252 -user sysdba -password masterkey msysdados.
fbk msys.fdb
gfix -validate -full -o msys.fdb

5 - Copiar o arquivo msys.fdb gerado na pasta bin do Firebird para a pasta de
dados do sistema e renomeá-lo para msysdados.fdb

7 - Realizar teste: acessar dois sistemas e fazer dois acessos simultâneos pelo
IBExpert.
