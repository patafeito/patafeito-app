# Patafeito — Direção de Produto, Design e Plano de Implementação

## 1. Visão

O Patafeito é um aplicativo mobile de produtividade gamificada. O usuário organiza tarefas, entra em sessões de foco e cuida de um pato que evolui junto com seu progresso.

A proposta deve incentivar pequenas vitórias e consistência, sem transformar produtividade em pressão.

## 2. Referência analisada

O projeto de referência, “Gamified Productivity App”, tem uma estrutura de telas adequada para o Patafeito:

1. Onboarding e escolha do pet;
2. Início/dashboard;
3. Lista, criação e detalhe de tarefas;
4. Página do pet;
5. Personalização;
6. Loja;
7. Temporizador de foco;
8. Histórico e relatórios;
9. Amigos, notificações e perfil.

O app Expo atual já possui as rotas-base para onboarding, início, tarefas, pet, foco e perfil. A primeira implementação deve priorizar essas seis áreas. Loja, personalização avançada, relatórios e recursos sociais entram depois que o ciclo central estiver funcional.

## 3. Direção visual

### Conceito

A identidade será inspirada em um **lago acolhedor**, com patos, água, pequenas conquistas e progresso gentil.

O layout funcional da referência pode ser aproveitado, mas o visual deve deixar de ser um RPG escuro com neon roxo. O Patafeito deve ter personalidade própria, mais orgânica, leve e calorosa.

### Paleta

| Uso | Cor sugerida |
|---|---|
| Fundo escuro | `#10233A` |
| Superfície/cartões | `#1C3651` |
| Superfície secundária | `#284864` |
| Principal/ações | `#42B9D4` |
| Recompensa/experiência | `#F7C948` |
| Sucesso | `#56B98A` |
| Alerta | `#F0846B` |
| Texto principal | `#F3F8FC` |
| Texto secundário | `#B9CAD9` |

### Estilo de componentes

- Cartões com cantos arredondados e bordas discretas;
- Sombras suaves, sem brilho neon constante;
- Gradientes discretos azul-piscina;
- Ilustrações e padrões leves de água, bolhas e ondas;
- Amarelo para experiência, conquistas e moedas;
- Azul para ações principais e navegação;
- Estados positivos em verde e alertas em coral.

### Tipografia

- Títulos: `Fredoka` ou `Baloo 2`;
- Texto geral: `DM Sans` ou `Nunito Sans`;
- Números compactos, cronômetro e experiência: `JetBrains Mono`.

## 4. Linguagem do produto

Usar os seguintes termos de forma consistente:

| Conceito | Termo no app |
|---|---|
| Mascote | pato |
| Necessidade de comida | fome |
| Vitalidade | energia |
| Estado emocional | felicidade |
| Pontos de progresso | experiência |
| Área de itens | loja |
| Pomodoro/concentração | foco |
| Dias consecutivos | sequência |

Exemplos:

- “Seu pato está com fome.”
- “Complete uma tarefa para ganhar experiência.”
- “Proteja sua sequência de 7 dias.”
- “Iniciar foco.”
- “Visitar loja.”

## 5. Os três patos

Os três patos têm a mesma progressão, recompensas e acesso a recursos. A escolha muda o tom do acompanhamento, sugestões, missões e elementos visuais — não cria vantagem competitiva.

### Pingo — o iniciador

**Perfil:** curioso, energético e encorajador.  
**Indicado para:** pessoas que querem vencer a inércia.

**Visual**
- Patinho amarelo;
- Penugem levemente desalinhada;
- Mochila pequena;
- Ambiente com trilhas, mapas e folhas.

**No app**
- Recomenda a menor próxima ação;
- Destaca tarefas rápidas ou paradas há mais tempo;
- Incentiva a primeira tarefa do dia;
- Celebra a primeira vitória com uma animação especial.

**Missão sugerida:** conclua uma tarefa de até 15 minutos.

### Maré — o concentrado

**Perfil:** tranquilo, sereno e concentrado.  
**Indicado para:** pessoas que querem trabalhar em blocos de foco.

**Visual**
- Pato azul-petróleo;
- Expressão calma;
- Fones ou boia minimalista;
- Ambiente de lago tranquilo, pedras e ondas.

**No app**
- Sugere uma tarefa para acompanhar a sessão de foco;
- Indica uma duração de foco apropriada;
- Acompanha o temporizador com expressões e animações;
- Celebra ciclos de foco concluídos.

**Missão sugerida:** complete um ciclo de foco de 25 minutos.

### Bento — o consistente

**Perfil:** organizado, paciente e confiável.  
**Indicado para:** pessoas que querem construir rotina.

**Visual**
- Pato branco ou creme, com manchas marrons;
- Lenço ou prancheta;
- Ambiente com ninho, calendário e plantas.

**No app**
- Destaca tarefas recorrentes;
- Mostra a sequência com mais evidência;
- Lembra hábitos pendentes antes de tarefas futuras;
- Celebra marcos de sequência.

**Missão sugerida:** conclua uma tarefa recorrente hoje.

## 6. Regras de gamificação

### Ações que geram experiência

- Concluir uma tarefa;
- Concluir uma tarefa de maior dificuldade;
- Finalizar uma sessão de foco;
- Cumprir a missão diária;
- Manter uma sequência;
- Atingir marcos semanais.

### Equilíbrio

- Nenhum pato deve receber mais experiência que outro;
- Diferenças entre patos são de recomendação, linguagem, missão e visual;
- As necessidades do pato devem motivar, não punir excessivamente;
- O usuário nunca deve perder progresso importante por ficar alguns dias sem abrir o app.

### Estado do pato

Estados iniciais:

- Fome;
- Energia;
- Felicidade;
- Nível;
- Experiência;
- Sequência.

Ações concluídas recuperam ou aumentam atributos de modo moderado:

- Concluir tarefa aumenta felicidade e gera experiência;
- Concluir foco aumenta energia e felicidade;
- Manter sequência gera experiência adicional e conquista visual;
- Muitos dias sem atividade reduzem felicidade levemente, sem bloquear recursos.

## 7. Fluxo das telas principais

### 7.1 Onboarding

1. Boas-vindas ao Patafeito;
2. Escolha entre Pingo, Maré e Bento;
3. Exibição de personalidade, visual e tipo de acompanhamento;
4. Escolha de nome para o pato;
5. Entrada na tela inicial.

### 7.2 Início

Estrutura:

1. Saudação ao usuário;
2. Card principal com pato, nome, nível, experiência e sequência;
3. Indicadores de fome, energia e felicidade;
4. Card de recomendação contextual do pato;
5. Ações rápidas: nova tarefa, iniciar foco e ver tarefas;
6. Lista reduzida de tarefas de hoje.

A recomendação varia:

- Pingo: “Comece por aqui”;
- Maré: “Seu próximo foco”;
- Bento: “Proteja sua sequência”.

### 7.3 Tarefas

Recursos iniciais:

- Lista de tarefas;
- Estado concluída/pendente;
- Criação de tarefa;
- Dificuldade;
- Categoria;
- Prazo;
- Tarefa recorrente;
- Experiência prevista;
- Filtros básicos.

Evolução posterior: detalhes completos, subtarefas, anexos, repetição avançada e tarefas compartilhadas.

### 7.4 Foco

Recursos iniciais:

- Escolha ou associação de uma tarefa;
- Temporizador de foco;
- Pausa;
- Conclusão ou cancelamento de sessão;
- Experiência pela sessão concluída;
- Feedback visual do pato.

Configuração inicial recomendada: 25 minutos de foco e 5 minutos de pausa, com ajuste de duração futuramente.

### 7.5 Página do pato

Exibir:

- Ilustração principal;
- Nome;
- Nível;
- Barra de experiência;
- Fome;
- Energia;
- Felicidade;
- Missão do dia;
- Histórico de conquistas básico.

Evolução posterior: personalização, itens equipados, ambientes, evoluções visuais por nível e loja.

### 7.6 Perfil

Exibir:

- Nome e avatar do usuário;
- Nível;
- Experiência total;
- Melhor sequência;
- Tarefas concluídas;
- Sessões de foco;
- Configurações básicas.

## 8. Plano de implementação

### Fase 1 — Fundação visual

1. Atualizar tokens de tema do app Expo;
2. Definir paleta, espaçamentos, raios e tipografia;
3. Criar componentes reutilizáveis: `Card`, `Badge`, `ProgressBar`, `IconButton`, `TaskItem`, `DuckStatus` e `ExperienceBar`;
4. Ajustar a tab bar à nova identidade visual;
5. Adicionar ícones consistentes às tabs.

**Resultado:** app visualmente coerente antes de expandir funcionalidades.

### Fase 2 — Onboarding dos patos

1. Substituir pets temporários pelos três patos;
2. Criar dados dos patos: id, nome, perfil, cor e missão;
3. Implementar seleção visual;
4. Permitir nomear o pato;
5. Salvar a escolha localmente;
6. Exibir o pato escolhido na tela inicial.

**Resultado:** usuário entra no app com um pato próprio.

### Fase 3 — Início e estado do pato

1. Criar card principal do pato;
2. Exibir nível, experiência, sequência, fome, energia e felicidade;
3. Criar recomendações específicas por pato;
4. Conectar tarefas locais ao resumo diário;
5. Atualizar experiência e felicidade após concluir tarefas.

**Resultado:** início deixa claro o que fazer agora e como o progresso afeta o pato.

### Fase 4 — Tarefas

1. Melhorar a lista existente;
2. Criar fluxo de tarefa com dificuldade, prazo e recorrência;
3. Implementar conclusão de tarefa;
4. Conceder experiência de acordo com a dificuldade;
5. Atualizar indicadores do pato e sequência;
6. Mostrar estados vazios e feedback de conclusão.

**Resultado:** ciclo central de produtividade funcional.

### Fase 5 — Foco

1. Criar temporizador funcional;
2. Permitir vincular sessão a uma tarefa;
3. Registrar sessões concluídas;
4. Conceder experiência;
5. Integrar comportamento visual de Maré;
6. Mostrar histórico simples de sessões.

**Resultado:** foco se torna uma segunda forma de avançar no app.

### Fase 6 — Persistência e sincronização

1. Consolidar dados locais de usuário, pato, tarefas, sessões de foco e progresso;
2. Conectar mutações à fila de sincronização existente;
3. Sincronizar estado com a API;
4. Tratar modo offline;
5. Garantir que o app continue útil sem conexão.

### Fase 7 — Expansões

Após validar o ciclo principal:

1. Loja;
2. Itens cosméticos;
3. Personalização do pato;
4. Histórico e relatórios;
5. Conquistas;
6. Notificações;
7. Amigos e tarefas compartilhadas.

## 9. Ordem recomendada de trabalho

1. Tema e design system;
2. Dados e seleção dos três patos;
3. Onboarding;
4. Card do pato na tela inicial;
5. Conclusão de tarefas e experiência;
6. Tela do pato;
7. Temporizador de foco;
8. Persistência e sincronização;
9. Loja e personalização;
10. Relatórios e social.

## 10. Critério de sucesso do MVP

O MVP estará pronto quando o usuário conseguir:

1. Escolher e nomear um pato;
2. Criar e concluir tarefas;
3. Ganhar experiência e subir de nível;
4. Ver fome, energia, felicidade e sequência;
5. Iniciar e concluir uma sessão de foco;
6. Receber recomendações coerentes com o pato escolhido;
7. Usar o app sem conexão e sincronizar depois.
