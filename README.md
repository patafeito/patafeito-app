# Patafeito App

Aplicativo mobile Expo/React Native do Patafeito.

## Executar

```bash
npm install
npm run start
```

Configure `EXPO_PUBLIC_API_URL` para apontar à API quando a integração for habilitada. A estrutura usa Expo Router, telas de onboarding e tabs para Início, Tarefas, Pet, Foco e Perfil. SQLite armazena entidades locais, cursor e fila persistente de sincronização; o Sync Engine envia mutações pendentes e aplica o `pull` ao iniciar o app quando há uma sessão salva.
