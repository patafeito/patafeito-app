# Patafeito — Direção de Arte e Design System

> **"Um pequeno lago acolhedor onde cada conquista faz sua jornada florescer."**
> Cozy Pixel Art + Modern Mobile UI + Soft Gamification.

Este documento é a fonte de verdade visual do app. Os tokens descritos aqui estão implementados em
`src/shared/theme/` (`palette.ts`, `tokens.ts`, `ThemeProvider.tsx`). Quando o código e este documento divergirem,
corrija um dos dois no mesmo PR.

---

## 1. Diagnóstico visual (antes do redesign)

### Pontos fortes
- **Pixel art coesa e com personalidade.** Pingo, Maré e Bento compartilham contorno marrom, pixels grandes e sombreamento suave. Os 5 cenários e os 17 itens da loja seguem a mesma linguagem.
- **Base técnica organizada.** Tokens centralizados, só 4 cores fixas fora deles, hook de movimento reduzido, piscada e respiração do pato já implementadas.
- **Microcopy acolhedora.** "Comece pequeno: uma tarefa clara já é progresso" já soa como o produto deveria soar.

### Problemas encontrados
| # | Problema | Impacto |
|---|---|---|
| 1 | Pixel art suavizada ao escalar (filtro bilinear em tamanhos arbitrários): o pato aparecia borrado. | Alto |
| 2 | Tema único escuro e quase monocromático: azul sobre azul, pouca separação entre superfícies e nenhum calor de madeira, areia ou creme. | Alto |
| 3 | Fonte do sistema, timer em `monospace` e 15 tamanhos de fonte soltos (11–64) sem escala. | Médio |
| 4 | Gamificação espalhada: moedas só na Loja e no Perfil, XP escondido no palco do pato e conquistas em texto puro. | Médio |
| 5 | Ícones só outline, sem estado ativo cheio. Moeda às vezes vinha como texto. | Médio |
| 6 | Hierarquia rasa: Início e Pato empilhavam cards iguais, sem um ponto focal. O cenário ficava atrás de conteúdo. | Alto |
| 7 | Feedback de toque só por opacidade. Seleção e foco inconsistentes. | Baixo |
| 8 | Hábitos e Conquistas sem tela própria. | Alto |

---

## 2. Direção de arte unificada

### Duas camadas
| Camada | O que entra | Regras |
|---|---|---|
| **Ilustrativa** | Mascotes, cenários, comidas, poderes, moedas, medalhas | Pixel art original, nunca vetorizada nem suavizada. Exibida em tamanho de pixel físico inteiro (`PixelImage`, frames `@2x` com vizinho mais próximo). |
| **Funcional** | Navegação, botões, cards, campos, listas, barras, tipografia | Formas arredondadas, superfícies lisas, sombras curtas e cores semânticas. Nada pixelado. |

O contraste é intencional. **A pixel art sempre recebe uma moldura funcional**: card arredondado, `SceneFrame` recortado ou fundo suave em círculo. Assim as duas camadas conversam sem se misturar.

### Princípios
1. **Um ponto focal por tela.** No Início é o pato; em Tarefas, o campo de nova tarefa; no Foco, o relógio; na Loja, os itens.
2. **Texto nunca sobre cenário.** Cenários vivem dentro do `SceneFrame`. Por cima da cena só entram selos pequenos com fundo sólido (sequência 🔥).
3. **Gamificação discreta, mas presente.** Moedas e sequência ficam em `StatPill` no topo do Início. O +XP sobe do item concluído. Conquistas aparecem em um resumo de uma linha.
4. **Motivação sem pressão.** Estados vazios convidam ("Lista limpinha"), nunca cobram. Vermelho é só para vencido ou destrutivo.
5. **Calma por padrão.** Animações curtas, nada em loop fora da tela e o Foco sem cenário.

### Evitar
Glassmorphism, gradientes artificiais, ícones 3D, neon, sombras pesadas, estética de RPG de combate, fontes pixeladas em texto corrido, várias cores saturadas lado a lado.

---

## 3. Paleta

### Base de marca
| Nome | HEX | Inspiração |
|---|---|---|
| Azul-marinho profundo | `#10233A` | Lago à noite |
| Azul-petróleo | `#284864` | Maré |
| Azul-piscina | `#42B9D4` | Água ao sol |
| Amarelo recompensa | `#F7C948` | Moedas, Pingo |
| Verde suave | `#56B98A` | Vegetação, Bento |
| Coral acolhedor | `#F0846B` | Pôr do sol |
| Creme | `#FFF3DB` | Areia, papel |
| Marrom dos contornos | `#493326` | Madeira, contorno da pixel art |

### Hierarquia cromática
1. **Primary (aqua):** só para ações e seleção.
2. **Reward (dourado):** XP, moedas, nível, conquistas desbloqueadas.
3. **Tertiary (coral):** calor e celebração, como a chama da sequência.
4. **Success (verde):** hábitos, concluído, pausa do foco.
5. **Danger:** vencido, erro, destrutivo.

As superfícies são sempre neutras (azul profundo ou creme). Nunca use duas cores saturadas como fundo lado a lado.

### Tokens semânticos
| Token | Dark | Light | Uso |
|---|---|---|---|
| `background` | `#10233A` | `#FBF4E6` | Fundo das telas |
| `backgroundSecondary` | `#0C1B2E` | `#F3E7CF` | Áreas recuadas |
| `surface` | `#1A3350` | `#FFFBF2` | Cards, campos, tab bar |
| `surfaceElevated` | `#234264` | `#FFFDF8` | Card de destaque, modais, toasts |
| `surfaceMuted` | `#152B45` | `#F1E6CF` | Trilhos de barra, agrupamentos secundários |
| `primary` / `primaryPressed` | `#42B9D4` / `#2F9DB8` | `#17788F` / `#11627A` | Botão principal, foco, links |
| `onPrimary` | `#10233A` | `#FFFFFF` | Texto sobre primary |
| `primarySoft` / `onPrimarySoft` | `#1B506B` / `#8FDAEC` | `#D6EEF3` / `#0E5A6E` | Selecionado, aba ativa, recomendação |
| `secondary` | `#284864` | `#284864` | Apoio (petróleo) |
| `tertiary` | `#F0846B` | `#B8472F` | Sequência, calor |
| `text` / `textSecondary` / `textDisabled` | `#F3F8FC` / `#B9CAD9` / `#6F87A0` | `#10233A` / `#4A6178` / `#9AA9B6` | Textos |
| `border` | `#2C4D6B` | `#E6D7B9` | Separação decorativa de cards |
| `borderStrong` | `#6688A8` | `#9A8460` | Contorno de controles (≥ 3:1) |
| `divider` | `#284B66` | `#EADFC8` | Linhas de lista |
| `outlinePixel` | `#493326` | `#493326` | Molduras de itens pixel art |
| `success` / `successSoft` / `onSuccessSoft` | `#56B98A` / `#1C4C41` / `#8ED8B2` | `#2E7D57` / `#DDF1E6` / `#1F6646` | Concluído, hábitos |
| `warning` / `warningSoft` / `onWarningSoft` | `#F7C948` / `#5A4B1B` / `#FFD866` | `#8A6100` / `#FDF0C4` / `#7A5500` | Atenção |
| `danger` / `dangerSoft` / `onDangerSoft` | `#F79C86` / `#543B3E` / `#FAB5A3` | `#B8472F` / `#FBE1DA` / `#8F3522` | Erro, vencido, destrutivo |
| `reward` / `rewardText` / `rewardSoft` | `#F7C948` / `#F7C948` / `#5A4B1B` | `#F7C948` / `#8A6100` / `#FDF0C4` | XP e moedas: preenchimento, texto, fundo |
| `achievement` | `#F0846B` | `#B8472F` | Celebração |
| `backdrop` | `rgba(5,14,26,.72)` | `rgba(16,35,58,.45)` | Fundo de modal |

### Acessibilidade de cor
- Todos os pares texto/superfície passam **WCAG AA (≥ 4.5:1)**. Exemplos: `text`/`background` 14.8 (dark) e 14.5 (light); `textSecondary`/`surface` 7.7 e 6.2; `primary`/`background` 6.9 e 4.7; `onPrimary`/`primary` 6.9 e 5.1.
- Os pares `on*Soft` sobre `*Soft` passam de 5.5:1, por isso os badges ficam legíveis.
- `borderStrong` passa de 3:1 sobre a superfície (WCAG 1.4.11 para contorno de controles). `border` é só decorativo.
- No tema claro o dourado não serve como texto (1.6:1). Por isso `rewardText` escurece para `#8A6100`, enquanto `reward` continua no preenchimento das barras.
- **Estado nunca depende só da cor:** aba ativa tem ícone cheio, seleção tem borda, concluído tem ✓ e vencido tem o texto "Venceu".

### Light vs. dark
- **Dark:** azuis profundos, sem preto puro. As superfícies sobem de tom conforme a elevação.
- **Light:** creme e areia em vez de branco puro. As sombras são marrom-madeira a 10%.
- A personalidade é a mesma nos dois: só as superfícies mudam, os papéis das cores continuam.
- A preferência fica em Perfil → Aparência (Sistema / Claro / Escuro) e é salva em `local_profile.appearance`.

---

## 4. Tipografia

| Família | Uso | Por quê |
|---|---|---|
| **Fredoka** SemiBold | Títulos de tela, títulos de diálogo, contador de conquistas | Arredondada, expressiva e amigável sem ser infantil |
| **Nunito** 400/600/700/800 | Todo o resto (UI, corpo, botões, números) | Terminações arredondadas e alta legibilidade em tamanhos pequenos |
| **Pixelify Sans** Medium | Somente valores de recompensa: "+20 XP", "Nv 3", "Conquistada" | Liga a recompensa à camada pixel art. Nunca usar em frases |

Números da UI usam `fontVariant: ['tabular-nums']`, para que o timer e os contadores não "dancem".

### Escala (`typography` em `tokens.ts`)
| Token | Família | Tamanho/linha | Uso |
|---|---|---|---|
| `display` | Fredoka | 32/38 | Marca, telas de entrada |
| `title` | Fredoka | 24/30 (headers 28/34) | Título de tela, nome do pato |
| `heading` | Nunito 800 | 18/24 | Título de seção e de card |
| `subheading` | Nunito 700 | 16/22 | Título de item de lista |
| `body` | Nunito 400 | 16/22 | Texto padrão |
| `bodySm` | Nunito 400 | 14/20 | Apoio, mensagens |
| `caption` | Nunito 600 | 12/16 | Badges, metadados |
| `label` | Nunito 700 | 14/18 | Rótulos de campo, chips, links |
| `button` | Nunito 800 | 16/20 | Botões |
| `numeric` | Nunito 800 tabular | 16/20 | Valores |
| `timer` | Nunito 800 tabular | 64/72 | Pomodoro |
| `reward` | Pixelify | 16/20 | +XP, nível, selos |

No Android, o peso vem da família (`Nunito_700Bold`) e não de `fontWeight`. Nunca combine os dois.

---

## 5. Componentes e espaçamento

### Espaçamento: grade de 4
`xs 4 · sm 8 · ms 12 · md 16 · lg 24 · xl 32 · xxl 40 · xxxl 56`
- Margem lateral das telas: 16. Largura máxima do conteúdo: 720 (tablets).
- Entre blocos de uma tela: `md`. Dentro de um card: `sm`–`ms`. Entre seções, o `SectionHeader` adiciona `sm` acima.

### Raios
`xs 6 · sm 10 · md 16 · lg 22 · xl 28 · pill`
- Botões e campos: `md`. Cards: `lg`. Modais: `xl`. Chips, pills e barras: `pill`.

### Elevação
| Nível | Uso | Estilo |
|---|---|---|
| 0 | Card padrão | Só borda `border` |
| 1 | Card de destaque (um por tela), segmento ativo | Sombra y4 / blur 10 |
| 2 | Modal, toast | Sombra y12 / blur 24 |

### Áreas de toque
Mínimo 44×44, botões com 52 de altura e chips com 40 (com `hitSlop` onde necessário).

### Catálogo (`src/shared/ui/`)
| Componente | Variantes / regras |
|---|---|
| `Button` | `primary` (uma por tela), `secondary` (contorno forte), `tertiary` (fundo suave, ações leves), `ghost` (texto), `danger` (confirma destrutivo), `dangerOutline` (oferece destrutivo). Tamanhos `regular` 52 e `compact` 44. Ao pressionar: cor `pressed` e escala 0.98. Desabilitado: 45% de opacidade. Ícone opcional à esquerda. |
| `IconButton` | 44×44 redondo: `default`, `primary`, `plain`. Sempre com `accessibilityLabel`. |
| `Card` | `default` (borda), `elevated` (sombra, no máximo um por tela), `muted` (agrupamento secundário), `primary` (próximo passo recomendado). |
| `Badge` | Pill com fundo `*Soft` e texto `on*Soft`: `primary`, `experience`, `success`, `danger`, `neutral`. |
| `ChipGroup` | `chips` (escolha de opção) ou `segmented` (troca de visão). Selecionado: `primarySoft` + borda `primary` (ou superfície elevada no segmentado). |
| `TextField` | Rótulo acima e borda `borderStrong`, que passa a `primary` 2px no foco. Erro vira borda e texto `danger`; a dica fica abaixo. |
| `ProgressBar` | `water` (foco e energia), `xp` (experiência e moedas), `habit` (hábitos). Reflexo de água no topo e preenchimento animado de 600ms. |
| `ExperienceBar` | Selo "Nv N" em Pixelify + barra `xp` + "x/y XP". |
| `StatPill` | Indicador compacto para headers: moeda em pixel art ou ícone, com valor tabular. |
| `ScreenHeader` / `SectionHeader` | Título Fredoka com ações à direita. Seção com link "Ver todas". |
| `SceneFrame` | Janela recortada para cenários. Sem cenário, mostra um "lago" liso no tom da superfície. |
| `EmptyState` | Mascote (`still`), título, mensagem e CTA `tertiary`, com borda tracejada. |
| `RewardBurst` | "+XP" e moeda subindo e sumindo sobre o item. |
| `WeekDots` | 7 dias do hábito: cheio = feito, contorno = previsto, apagado = fora da agenda, tracejado = hoje. |
| `Dialog` / `ConfirmDialog` | Cartão central `xl` com `backdrop` do tema. Imagem pixel em círculo suave. Ação destrutiva à direita, em `danger`. |
| `PixelImage` | Pixel art em tamanho de pixel físico inteiro. Só para a camada ilustrativa. |
| `NoticeHost` | Toast no topo com ícone (informação ou offline). |

### Navegação inferior
- Cinco abas: **Início · Tarefas · Hábitos · Foco · Pato**.
- Ícone ativo cheio dentro de uma pill `primarySoft`; inativo vazado em `textSecondary`. Rótulo Nunito Bold 11.
- Perfil sai das abas: abre pelo avatar no Início. Loja, Conquistas e Trocar pato são telas empilhadas.

### Regras de ícones
| Categoria | Família | Regras |
|---|---|---|
| Funcionais (navegação, ações, status) | **Ionicons** | Outline quando inativo, filled quando ativo ou com ênfase. Tamanhos 16 / 18–20 / 22 (aba e header). Cor sempre de token. |
| Colecionáveis e recompensas | **Pixel art** (`PixelImage`) | Moeda, comidas, poderes, cenários, medalhas, mascotes. Nunca em botão de ação ou na navegação. |

Proibido trocar de família dentro da mesma categoria. Uma moeda é sempre pixel art; uma chama de sequência é sempre Ionicons `flame`.

---

## 6. Telas

| Tela | Ponto focal | Estrutura |
|---|---|---|
| **Início** | Pato no `SceneFrame` | Saudação por período e data, avatar (Perfil) → `StatPill` moedas (abre Loja) e sequência → palco do pato (fala + XP, sem status) → card "Próximo passo" com **uma** ação → "Hoje" (até 4 tarefas, com fade ao concluir) ou estado vazio → resumo de conquistas em uma linha → aviso de sincronização pendente. |
| **Tarefas** | Campo "Nova tarefa" | Header com contagem de pendentes → card de criação com opções recolhidas (dificuldade, repetição, prazo) → filtro segmentado (padrão: Pendentes) → lista com +XP à direita e `RewardBurst` ao concluir → dica "toque para concluir · segure para editar" → editor em `Dialog`. |
| **Hábitos** *(nova)* | Cards de hábito | Header "x de y feitos hoje" → celebração do Bento quando tudo está feito → "Novo hábito" (nome, frequência, dia) → cards com título, regra, chama da sequência, `WeekDots`, taxa de 30 dias e "Marcar hoje · +XP". Hábito = série de tarefas recorrentes (mesmo `seriesId`), sem backend novo. |
| **Foco** | Timer de 64pt | Fundo liso, sem cenário. Maré (ou o pato atual) pequeno, selo de fase (Em foco / Pausa / Ciclo completo), timer tabular, barra `water` (vira `habit` na pausa) e legenda curta. Enquanto o timer roda, ritmo, minutos e vínculo com tarefa somem: só ficam Pausar e Cancelar. |
| **Pato** | Palco grande com status | Header com trocar pato → palco 200 com status → seletor de cenário (miniaturas dos cenários comprados + "Liso") → Cuidados (bandeja de comida) → atalhos Loja e Conquistas → missão do dia → apelido → sobre a espécie. |
| **Loja** | Itens em pixel art | Saldo (pilha de moedas em fundo dourado suave) → poderes ativos → Loja/Mochila segmentado → categorias → grade 2 colunas. Item a 80px sobre um "palco" suave; preço vermelho e botão "Faltam moedas" quando o saldo não basta; borda `primary` quando o cenário está em uso. |
| **Conquistas** *(nova)* | Contador "N / 12" | Resumo com barra `xp` e a conquista mais próxima → "Conquistadas" (moeda brilhante pixel, borda dourada, selo Pixelify) → "A caminho" (ícone apagado e progresso). As conquistas são calculadas no aparelho (`features/achievements/domain/catalog.ts`). |
| **Perfil** | — | Seções: Conta, Progresso (linhas com ícone e divisor), **Aparência**, Sincronização, Segurança, Zona de cuidado (resetar, sair com `dangerOutline`). |

Fluxos e regras de negócio existentes foram preservados. Só mudaram a apresentação, a posição do Perfil e as duas telas novas.

---

## 7. Mascotes, cenários e recompensas

### Papéis dos mascotes
| Mascote | Representa | Onde aparece |
|---|---|---|
| **Pingo** | Tarefas, iniciativa | Vazios de Tarefas e do Início |
| **Maré** | Foco | Acompanha o cronômetro (quando é o pato do usuário) |
| **Bento** | Hábitos, rotina | Vazio de Hábitos, celebração "Rotina em dia" |
| Pato do usuário | Companhia | Início, Pato, Foco, reações (`celebrate`) |

### Regras
- O mascote não aparece em toda tela: formulários, Perfil e Loja ficam sem ele.
- O tamanho segue o contexto: 104–120 no Foco e 112 em estados vazios. No palco (`PetStage`) o pato ocupa 70% da altura do cenário e pisa no chão (9% acima da borda), com palco 1.45:1 no Início e 1.1:1 na página do pato.
- Estados vazios usam o sprite `still` (sem loop).
- Cenários **só** dentro de `SceneFrame` ou de miniaturas. Sem cenário equipado, aparece o lago liso do tema.
- Recompensas sempre em pixel art + número tabular ou Pixelify. A moeda nunca vira texto.
- Uma celebração por vez: o +XP sobe no item e o pato comemora no Início, sem confete em cascata.

### Acessórios
O domínio atual (`ShopCategory`) tem só `food`, `power` e `background`. Os acessórios ficam previstos como um 4º slot
(`accessory`) com camada de sprite por cima do frame do pato. Isso depende de arte e de suporte na API e não foi implementado.

---

## 8. Microinterações e movimento

| Interação | Implementação | Com movimento reduzido |
|---|---|---|
| Piscada (2,2–5,4s) e respiração (2,6s) | `PetSprite` | Desligadas |
| Pulo ao comemorar | `PetSprite` (`cheer`) | Desligado |
| Check com "pop" | `TaskItem` (spring) | Sem escala |
| +XP e moeda subindo | `RewardBurst` (900ms) | Só aparece e some |
| Barra enchendo | `ProgressBar` (600ms, easeOut) | Valor final direto |
| Item concluído saindo | `FadeOut` + `LayoutAnimation` | Só fade |
| Toast | Fade 200ms | Igual |

Tokens de movimento: `fast 120 · base 200 · slow 320 · celebrate 600`.
Loops contínuos (respirar e piscar) **pausam quando a tela perde o foco** (`useIsFocused`), para poupar bateria.

---

## 9. Implementação mobile

### Tema
```tsx
import { useTheme, useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';

function MyCard() {
  const styles = useThemedStyles(makeStyles); // calculado 1x por esquema e cacheado
  const { colors } = useTheme();              // para props que não são estilo (cor de ícone)
  …
}
const makeStyles = ({ colors, elevation }: Theme) => StyleSheet.create({ … });
```
- `makeStyles` fica **fora** do componente (é a chave do cache).
- Nunca use hex direto em componente. Se faltar um papel, crie o token em `palette.ts` nos dois temas e confira o contraste.
- `app.json` usa `"userInterfaceStyle": "automatic"`. A `StatusBar` segue o esquema.

### Fontes
Carregadas com `useFonts` em `src/app/_layout.tsx` (pacotes `@expo-google-fonts/*`). Se o carregamento falhar, o app segue com a fonte do sistema.

### Pixel art nítida
- Nenhum renderizador do RN ou do `expo-image` oferece filtro "nearest" (conferido na doc do SDK 58). Por isso:
  - `npm run pixel-assets` gera frames `@2x` dos patos com `kernel: 'nearest'`. O RN escolhe a variante pela densidade e quase não reescala em tempo de execução.
  - `PixelImage` arredonda o tamanho para pixel físico inteiro.
- Itens da loja já vêm em 256px e aparecem a 44–88dp, então só reduzem (sem borrar).
- Ao adicionar arte nova: exporte num múltiplo inteiro da grade de pixel e rode `npm run pixel-assets` se for frame de pato.

### Performance
- Use `useNativeDriver` em transformações e opacidade. Só a largura da barra usa o driver JS (barra curta e rara).
- Os sprites ficam pré-carregados por espécie (`preloadSpecies`).

---

## 10. Lista priorizada de mudanças

| Prioridade | Mudança | Impacto visual | Usabilidade | Esforço | Status |
|---|---|---|---|---|---|
| P0 | Tokens semânticos + light/dark + escolha manual | Alto | Alto | Médio | ✅ |
| P0 | Tipografia Nunito/Fredoka/Pixelify com escala | Alto | Médio | Baixo | ✅ |
| P0 | Pixel art nítida (`@2x` nearest, `PixelImage`) | Alto | — | Baixo | ✅ |
| P0 | Componentes base refeitos (Button, Card, Chip, TextField, ProgressBar, Dialog) | Alto | Alto | Médio | ✅ |
| P1 | Navegação com Hábitos e ícone ativo cheio; Perfil fora das abas | Médio | Alto | Baixo | ✅ |
| P1 | Início com ponto focal único, `StatPill` e resumo de conquistas | Alto | Alto | Médio | ✅ |
| P1 | Tela de Hábitos (`WeekDots`, sequência, taxa) | Alto | Alto | Médio | ✅ |
| P1 | Foco minimalista (opções recolhidas durante o ciclo) | Médio | Alto | Baixo | ✅ |
| P1 | Tela de Conquistas (catálogo local) | Médio | Médio | Médio | ✅ |
| P2 | Tarefas com criação recolhida, +XP e estados vazios ilustrados | Médio | Alto | Baixo | ✅ |
| P2 | Loja com item como protagonista e estados de saldo | Médio | Médio | Baixo | ✅ |
| P2 | Pato com seletor de cenário | Médio | Médio | Baixo | ✅ |
| P3 | Acessórios equipáveis (slot `accessory`) | Alto | Médio | Alto (arte + API) | Pendente |
| P3 | Conquistas sincronizadas no servidor (notificar desbloqueio) | Médio | Médio | Médio | Pendente |
| P3 | Ícone de app e splash nos dois temas | Médio | — | Baixo | Pendente |
| P3 | Fontes embutidas via config plugin do `expo-font` (build nativo) | — | Baixo | Baixo | Pendente |
