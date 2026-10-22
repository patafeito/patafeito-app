# Patafeito App

Aplicativo mobile Expo/React Native do Patafeito.

## Executar

```bash
npm install
npm run start        # ou: npm run android
npm run lint
npm run typecheck
```

Configure `EXPO_PUBLIC_API_URL` para apontar à API. O padrão é `http://10.0.2.2:3000/api/v1`, que é como o emulador Android enxerga a API rodando em `localhost:3000`.

## Como o app está organizado

- **Rotas** (`src/app/`): `(auth)/sign-in` e `(auth)/sign-up`, `onboarding` e as abas Início, Tarefas, Pato, Foco e Perfil. `index.tsx` decide o destino inicial: sem sessão vai para o login, com sessão e sem pato vai para o onboarding.
- **Sessão** (`src/shared/network/auth-session.ts`): access token em memória, refresh token no armazenamento seguro e renovação single-flight. `authorizedFetch` repete a chamada uma única vez após renovar.
- **Banco local** (`src/db/`): SQLite migrado por `PRAGMA user_version`. Guarda tarefas, snapshot do pato, sessões de foco, inventário, notificações, perfil e a fila de sincronização.
- **Offline-first**: criar, concluir tarefa e concluir um ciclo de foco gravam no SQLite e enfileiram a operação. XP e moedas aparecem como estimativa (“a confirmar”) até o servidor responder; o saldo confirmado vem de `GET /rewards/balance`.
- **Sincronização**: acontece ao abrir o app, ao voltar do segundo plano, após cada mutação e no gesto de puxar para atualizar na tela de Tarefas. O `opId` de cada operação garante que nada seja creditado duas vezes.

## Marca

`npm run brand` prepara os assets de identidade a partir de `assets/icon.png` e `assets/banner.png`:

- `android-icon-foreground.png` — o ícone adaptativo do Android recorta o canvas (em alguns launchers só o círculo central aparece), então a arte é reduzida a 68% e centralizada; o fundo é a cor `#10233A` definida em `app.json`;
- `banner-prepared.png` — a arte do banner reduzida a 1024 px de largura. Se o PNG tiver vindo com o xadrez de transparência achatado nos pixels (os quatro cantos em cinza neutro), o fundo ligado às bordas é removido antes;
- `favicon.png` — versão 96 px do ícone para a web.

Rode o comando sempre que trocar `icon.png` ou `banner.png`. O componente `<BrandBanner>` exibe a cena, o nome do app e uma linha de apoio no login e no cadastro; a arte é recortada pelo card, então qualquer proporção de banner preenche a faixa sem vazar da tela.

## Sprites dos patos

As folhas originais ficam em `assets/pets/`: `base1.png` e `base2.png` trazem os três patos lado a lado formando o par de piscada — a base1 com os olhos abertos e a base2 piscando, **exceto Maré, que vem ao contrário** — e `pingo.png`, `mare.png` e `bento.png` trazem cinco poses cada: feliz 1, feliz 2, foco, cansado e comendo.

`npm run sprites` fatia essas folhas em `assets/pets/frames/<espécie>-<estado>.png`, detectando cada sprite pelo alfa, normalizando a escala pelo pato em pé e alinhando todos pelos pés num mesmo quadro (as medidas vão para `frames/manifest.json`). Só os quadros entram no bundle; as folhas permanecem como fonte. Rode o comando sempre que a arte mudar.

Na interface, `<PetSprite>` desenha o pato: ele respira continuamente, alterna `idle` e `blink` em intervalos irregulares e dá um pulinho ao entrar numa pose de comemoração. Tudo isso para quando o sistema pede movimento reduzido (`useReducedMotion`).

`<PetStage>` é o pato em destaque na Início e na aba Pato: aceita toque (alterna as duas poses felizes), mostra o pensamento do momento e combina três fontes de estado, nesta prioridade — reação explícita (`celebrate()`, usado ao concluir tarefa ou ciclo de foco), toque, e humor ambiente derivado de fome, energia e felicidade por `moodFor()`. Como "feliz" é a situação normal, `useAmbientPose` alterna essa pose com o repouso para o pato continuar piscando em vez de congelar sorrindo.

A direção de produto e o plano de fases estão em [`docs/patafeito-ui-implementation.md`](docs/patafeito-ui-implementation.md); a arquitetura, em [`docs/Patafeito_Arquitetura_App.md`](docs/Patafeito_Arquitetura_App.md).
