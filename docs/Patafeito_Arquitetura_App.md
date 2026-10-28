# Patafeito — Arquitetura do Aplicativo Mobile

Documento técnico de arquitetura • versão 1.0 • 12/10/2026

Status: arquitetura-alvo com o ciclo central do MVP implementado; o que já existe e o que falta está em “Situação em 27/10/2026”, na seção 14. Base: Roteiro do Projeto de Desenvolvimento de Solução Computacional (43 páginas).

Convenção: \[BASE\] = previsto no roteiro; \[PROPOSTA\] = detalhamento técnico recomendado; \[DECIDIR\] = item em aberto.

## Resumo executivo

\[BASE\] App de produtividade gamificada com tarefas, Pomodoro, pet com fome/saúde/felicidade, evolução, cosméticos, amigos e notificações. Pilha indicada: React Native + TypeScript, SQLite local, Lottie/Rive, Firebase Cloud Messaging e MVVM. \[PROPOSTA\] Organização por feature e repositórios com banco local como fonte de leitura.

## 1. Visão do produto

- Público principal: estudantes universitários e jovens com dificuldade de manter rotina e foco.

- Loop central: planejar tarefa → focar/executar → concluir → receber XP/moedas → ver pet reagir/evoluir → voltar no dia seguinte.

- O pet acompanha o progresso: mascote não deve tornar tarefas triviais difíceis nem criar punições frustrantes.

- Fluxo essencial demonstrável offline; sincronização depende da decisão de escopo e contrato com backend.

## 2. Mapa de experiência e navegação

> Onboarding: Boas-vindas → Cadastro/Login → Escolher espécie → Nomear pet
>
> Main Tabs: Início \| Tarefas \| Pet \| Foco \| Perfil
>
> Início → Tarefa rápida / Estado do pet / Próximo prazo / Recompensas
>
> Tarefas → Lista → Criar/Editar → Detalhes → Concluir/Replanejar
>
> Pet → Interagir → Evolução → Inventário → Loja
>
> Foco → Modo → Vínculo à tarefa → Contagem → Resultado
>
> Perfil → Histórico / Relatórios / Amigos / Notificações / Configurações

\[BASE\] As telas do roteiro incluem escolha de parceiro e nomeação (pp. 11–12), home (13), tarefas e criação (14–15), pet e cosméticos (16–18), foco e loja (18–19, títulos dessas duas seções estão trocados), perfil, relatórios, amigos e notificações (20–24).

## 3. Arquitetura MVVM e responsabilidades

> SCREEN / VIEW (React Native)
>
> ↓ actions & observable state
>
> VIEW MODEL / HOOK (por feature)
>
> ↓ use cases
>
> DOMAIN (tipos, regras de apresentação e estados)
>
> ↓ repository interface
>
> DATA (SQLite local + outbox + REST sync)
>
> ↑ event/update → query → re-render

\[PROPOSTA\] Views não acessam API nem banco diretamente. ViewModels usam casos de uso e expõem loading, erro, dados e comandos. Repositórios leem e gravam SQLite; Sync Engine transporta alterações e reconcilia com servidor.

### 3.1 Estrutura de projeto sugerida

> src/
>
> app/{navigation,providers,theme,bootstrap}
>
> shared/{ui,types,utils,network,storage,notifications}
>
> features/
>
> auth/{screens,viewmodels,domain,data}
>
> onboarding/{screens,viewmodels}
>
> home/{screens,components,viewmodels}
>
> tasks/{screens,components,viewmodels,domain,data}
>
> pet/{screens,components,viewmodels,domain,data,animations}
>
> focus/{screens,components,viewmodels,domain,data}
>
> rewards/{components,domain,data}
>
> shop/{screens,viewmodels,data}
>
> profile/{screens,viewmodels}
>
> reports/{screens,viewmodels}
>
> friends/{screens,viewmodels}
>
> sync/{queue,engine,conflicts,connectivity}
>
> db/{schema,migrations,queries}
>
> assets/{images,animations,fonts}
>
> tests/{unit,component,integration,e2e}/

## 4. Estado de UI e dados

| Tipo de estado | Estratégia proposta                                                      |
|----------------|--------------------------------------------------------------------------|
| Efêmero        | Formulários, seleção, abas e modal: estado local do React                |
| Feature        | ViewModel/hook; estado derivado da consulta local                        |
| Persistente    | SQLite: tarefas, pet, sessões, catálogos cacheados, alterações pendentes |
| Segredo        | Token em armazenamento seguro do SO; nunca AsyncStorage sem proteção     |
| Servidor       | Fonte de verdade para XP, moedas, perfil remoto, conflitos e compras     |
| Sync           | Fila de operações locais + metadados de versão/cursor                    |

\[PROPOSTA\] Escolher stack concreta de navegação, consultas reativas, estado e SQLite após prova de conceito em Android. Evitar dependências duplicadas sem necessidade.

## 5. Modelo offline-first

- Criar/editar tarefa: persistir imediatamente no SQLite, atualizar UI e colocar operação na fila.

- Ao concluir offline: marcar pending_sync; mostrar XP estimado separado do saldo confirmado; confirmar somente após resposta do backend.

- Consulta de pet usa snapshot local sincronizado; estados provisórios claramente diferenciados, sem sobrescrever o valor confirmado.

- Processar fila na reconexão e retomada do app, com retry/backoff e ordenação por dependências.

- Reconciliar conflitos por version e exigir ação do usuário para edições concorrentes não triviais.

- Preservar dados em troca de conta; separar base/cache por usuário e limpar sessões sensíveis no logout.

## 6. Especificações de telas e comportamentos

| Tela             | Elementos principais e estados                                                    |
|------------------|-----------------------------------------------------------------------------------|
| Onboarding       | Pet inicial, características, escolha, nome 2–15 caracteres, feedback imediato    |
| Home             | Mascote, barras, nível, XP, streak, tarefas do dia, CTA foco e nova tarefa        |
| Lista de tarefas | Busca, status, dificuldade, prazo, recompensa, vazia/erro/offline                 |
| Editor de tarefa | Título/descrição, dificuldade, categoria, prazo, estimativa, recorrência/especial |
| Pet              | Saúde, fome, felicidade, fase de vida; ações alimentar/brincar/curar/mimar        |
| Loja/inventário  | Moedas, catálogo, bloqueios, compra, equipado, detalhes e confirmação             |
| Foco             | Pomodoro 25/5, Deep Work/Sprint se confirmados, vínculo opcional e fim de sessão  |
| Perfil           | Dados de conta, metas, histórico, relatórios, conquistas, configurações           |
| Social           | Amigos e ranking somente se incluídos no corte de entrega                         |
| Notificações     | Prazo, condição do pet, ações para abrir contexto correto                         |

### 6.1 Estados universais de tela

- Carregando: skeleton ou indicador discreto, sem bloquear navegação inteira.

- Vazio: instrução e ação contextual (“Criar primeira tarefa”).

- Erro: mensagem humana + tentar novamente; detalhe técnico somente em log.

- Offline: ícone e texto “Alterações serão sincronizadas”, sem prometer confirmação.

- Conflito: explicação de versões e escolha de manter local/remoto, quando aplicável.

- Acessibilidade: texto não depende só de cor, áreas de toque generosas e rótulos legíveis.

## 7. Design system e identidade Patafeito

\[PROPOSTA\] Personalidade: brasileira, acolhedora, divertida e clara. Os protótipos existentes usam interface escura com acentos vibrantes; manter como referência, mas testar contraste e leitura.

| Token       | Orientação                                                                                     |
|-------------|------------------------------------------------------------------------------------------------|
| Cores       | Superfícies escuras/neutras; roxo como marca; verde para sucesso; laranja para ação/recompensa |
| Tipografia  | Escala 12/14/16/20/28; altura de linha confortável; tamanhos dinâmicos                         |
| Componentes | Botões, cards, barra de XP, badge, task item, modal, toast, pet status, timer                  |
| Animação    | Lottie/Rive com fallback estático e preferência de movimento reduzido                          |
| Tom de voz  | “Patafeito! Tarefa concluída.”, “Bora pra próxima?”, evitar culpa e punição agressiva          |

## 8. Motor visual do pet

- Separar estado lógico (atributos e nível do backend) do estado visual (idle, happy, hungry, sad, evolve).

- Máquina de estados visual prioriza interação explícita \> evolução \> reação de recompensa \> humor ambiente.

- Animações pré-carregadas e com limite de custo; baixar resolução se necessário para desempenho.

- Fonte de verdade dos atributos: backend quando conectado, último snapshot local quando offline.

- Nunca derivar mudança permanente de XP do fim de uma animação; eventos visuais podem repetir sem conceder prêmio.

## 9. Temporizador e ciclo de foco

- Controlar relógio a partir de startedAt e duração-alvo (diferença entre instantes), não por contagem de setInterval; suporte pausa/retorno do app.

- Persistir sessão em SQLite; ao reabrir, reconstruir tempo restante a partir do tempo monotônico quando disponível e timestamp persistido.

- Concluir somente se critérios de integridade definidos pelo backend forem atendidos; não prometer bloqueio absoluto de apps do sistema.

- \[BASE\] Pomodoro de 25 min e pausa de 5 min; após quatro ciclos pausa longa, duração a definir.

- Permissões e restrições do Android para anti-distração precisam de prova técnica; oferecer modo de interface focada como fallback.

## 10. Integração com API e segurança

- Cliente HTTP centralizado com timeout, interceptação de 401 e refresh com single-flight para evitar renovação simultânea.

- Token de acesso em memória e refresh token em Keychain/Keystore via armazenamento seguro; limpar na saída.

- Schemas de request/response tipados; mapear erros a mensagens de domínio.

- Não embutir segredos privados ou credenciais FCM server-side no APK.

- Deep links/notificações navegam à entidade apenas após validar login e posse do recurso.

- Observabilidade sem PII: eventos de erro, duração de sincronização e travamentos com consentimento aplicável.

## 11. Notificações e permissões

- Lembretes locais podem cumprir prazos conhecidos sem internet; FCM cobre alertas que exigem decisão do servidor.

- Solicitar permissão de notificação contextualizada, não obrigatoriamente na primeira tela.

- Agendamento/reagendamento cancela lembrete antigo; deduplicar push/local pelo eventId.

- Aplicar preferência de horário silencioso e tratamento de fuso, conforme decisão de produto.

## 12. Qualidade, testes e desempenho

| Nível          | Cenários                                                                        |
|----------------|---------------------------------------------------------------------------------|
| Unitário       | Validação, formatação, cálculo tempo restante, fila e merge de dados            |
| Componentes    | Cards/tarefas, formulários, barras, tratamento loading/offline/erro             |
| Integração     | ViewModel ↔ repositório ↔ SQLite; migrations; refresh auth                      |
| E2E            | Primeiro acesso → pet → tarefa → Pomodoro → recompensa → loja                   |
| Resiliência    | Modo avião, force stop durante Pomodoro, dispositivo sem espaço, sync duplicada |
| Acessibilidade | Leitor de tela, fontes ampliadas, baixo contraste, movimento reduzido           |

\[BASE\] RNF de operações em até 2 segundos e animações próximas a 60 fps; iniciar testes em aparelhos Android reais, especialmente modelos modestos.

## 13. Build, distribuição e configuração

- Definir minSdk compatível com Android 10+ e variantes dev/staging/prod; assinar builds de distribuição.

- \[DECIDIR\] iOS: seção de escopo exclui iOS, mas RNF010 pede iOS 15+. Recomenda-se Android como MVP inicial até decisão formal.

- CI: lint, typecheck, testes, build Android, verificação de permissões e distribuição para teste interno.

- Versionar schema local e manter migrações reversíveis quando possível; bloquear uso de banco de versão desconhecida.

- Configurar URLs/flags por ambiente, sem segredos em bundle.

## 14. Plano de implementação por fases

- Fase 0 — validar navegação, telas críticas, branding, Android alvo e design tokens.

- Fase 1 — shell de navegação, auth, escolha/nome do pet, banco SQLite, camada de repositório.

- Fase 2 — tarefas CRUD, dificuldade, lista/home e exibição do estado pet.

- Fase 3 — foco resiliente a background, celebrações de recompensa e atualização de atributos.

- Fase 4 — loja/inventário, relatórios básicos e notificações.

- Fase 5 — sync e conflitos, sociais opcionais, acessibilidade, desempenho e testes E2E.

**Situação em 27/10/2026:**

- **Feito:** fases 1 a 3; loja e inventário da fase 4; fila de sync com retry/backoff, idempotência por `opId` e renovação de token single-flight da fase 5; edição e reagendamento de tarefas.
- **Feito de outro jeito:** a estrutura segue `features/<x>/{application,domain,infrastructure,components}` em vez de `viewmodels/data`. A navegação usa Expo Router em `src/app/`. As animações do pato usam quadros PNG com `Animated` (sem Lottie/Rive) e respeitam o movimento reduzido.
- **Pendente:** relatórios (`features/reports/` vazio), amigos/social (`features/friends/` vazio), tela de notificações (os dados já sincronizam), lembretes locais/push, UI de resolução de conflitos (conflitos ficam marcados na fila e o pull traz a versão do servidor), busca e categoria de tarefas, fontes da identidade, testes automatizados, CI e variantes dev/staging/prod.

## 15. Critérios de pronto e dúvidas

- Uma tarefa criada offline permanece após reiniciar o app e sincroniza sem duplicar quando a rede volta.

- XP e moedas não são concedidos duas vezes após repetição do evento ou restart.

- Ao concluir tarefa, home, lista e pet refletem o mesmo estado após confirmação.

- Temporizador não perde sessão ao navegar, suspender ou reabrir o app dentro das limitações do SO.

- Definir espécies, atributos e efeitos reais: protótipos mostram pets elementais, mas bônus precisam ser padronizados.

- Definir MVP social, offline sync completo, suporte iOS e UX de penalidade por inatividade.

## 16. Rastreabilidade e limites

Fonte principal: roteiro da equipe, sobretudo pp. 2–10 (requisitos), 11–24 (protótipos e fluxos), 25–30 (arquitetura/stack) e 31–35 (dados). As recomendações desta especificação só valem como entregues quando constam na situação da seção 14; o restante continua sendo proposta.
