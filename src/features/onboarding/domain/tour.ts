import type { ComponentProps } from 'react';
import type { Ionicons } from '@react-native-vector-icons/ionicons';

export type TourSlide = {
  id: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  /** Onde fica no app, para a pessoa achar depois. */
  where: string;
  points: string[];
};

/**
 * Apresentação dos módulos, mostrada uma vez logo depois de criar o pato e sempre disponível
 * no Perfil ("Como usar o Patafeito"). Os números seguem as regras atuais do app.
 */
export const tourSlides: TourSlide[] = [
  {
    id: 'tasks',
    icon: 'checkmark-circle',
    title: 'Tarefas',
    where: 'Aba Tarefas',
    points: [
      'Crie tarefas com dificuldade: fácil vale 10 XP, média 20 e difícil 40.',
      'Escolha categoria, prazo (hoje, amanhã ou esta semana) e quanto tempo deve levar.',
      'Toque para concluir, segure para editar, reagendar ou reaproveitar uma tarefa feita.',
      'Tarefas especiais marcam momentos únicos: não dão XP, mas o pato reage de um jeito raro.',
    ],
  },
  {
    id: 'habits',
    icon: 'leaf',
    title: 'Hábitos e sequência',
    where: 'Aba Hábitos',
    points: [
      'Tarefas que se repetem (diárias, semanais ou mensais) viram hábitos.',
      'Cada dia com tarefa concluída aumenta sua sequência; no 3º dia e a cada 7 você ganha bônus.',
      'O Escudo da sequência, da loja, salva um dia em que não deu.',
    ],
  },
  {
    id: 'focus',
    icon: 'timer',
    title: 'Foco',
    where: 'Aba Foco',
    points: [
      'Pomodoro (25/5), Deep Work (50/10) ou Sprint (15/3), com pausa longa depois de alguns ciclos.',
      'Cada 25 minutos completos rendem 20 XP e 5 moedas e recarregam a energia do pato.',
      'O modo foco deixa a tela cheia e acesa: sair do app por mais de 1 minuto interrompe o ciclo.',
    ],
  },
  {
    id: 'pet',
    icon: 'paw',
    title: 'Seu pato',
    where: 'Aba Pato',
    points: [
      'Saciedade, energia e felicidade caem com o tempo. Tarefas e foco ajudam a repor.',
      'Toque no pato para fazer carinho: +5 de felicidade, uma vez por hora.',
      'Alimente e cure com itens da mochila. Cumprir a meta do dia (60 XP) deixa ele feliz.',
      'Tarefas vencidas e dias sem atividade deixam o pato triste. Ele sobe de nível com o seu XP.',
    ],
  },
  {
    id: 'shop',
    icon: 'storefront',
    title: 'Loja e personalização',
    where: 'Pato → Loja e Personalizar',
    points: [
      'Gaste moedas em comidas, poderes (XP ou moedas em dobro, escudo) e cenários.',
      'Alguns itens desbloqueiam conforme o nível do pato.',
      'Em Personalizar, veja o cenário antes de salvar.',
    ],
  },
  {
    id: 'notifications',
    icon: 'notifications',
    title: 'Lembretes',
    where: 'Sino no Início',
    points: [
      'Avisos de prazo chegando, tarefa vencida, pato com fome e sequência em risco.',
      'Tudo fica guardado na central de notificações; ajuste o que receber no Perfil.',
    ],
  },
  {
    id: 'reports',
    icon: 'stats-chart',
    title: 'Histórico e relatórios',
    where: 'Perfil → Histórico e Relatórios',
    points: [
      'Veja sua semana em barras, o mês em um mapa de atividade e as tarefas concluídas.',
      'Relatórios mostram evolução de XP, categorias, desempenho geral e a evolução do pato.',
    ],
  },
  {
    id: 'friends',
    icon: 'people',
    title: 'Amigos',
    where: 'Atalho Amigos no Início',
    points: [
      'Adicione amigos pelo @usuário e acompanhe quem está online.',
      'Dispute o ranking da semana ou do mês e mande um incentivo por dia.',
      'Seu e-mail nunca aparece para outras pessoas.',
    ],
  },
  {
    id: 'offline',
    icon: 'cloud-done',
    title: 'Funciona sem internet',
    where: 'Em todo o app',
    points: [
      'Tarefas, foco e cuidados funcionam offline e sincronizam quando a rede volta.',
      'Amigos, ranking e compras na loja precisam de conexão.',
    ],
  },
];
