# Banco local

SQLite será a fonte de leitura offline. A primeira migração deve incluir tarefas, snapshot do pet e fila de operações (`opId`, versão-base e payload), antes de habilitar sincronização com a API.
