/** Falas raras do pato, reservadas às tarefas especiais (RN14): o prêmio é o momento, não o XP. */
export const rareLines = [
  'Quack! Esse dia vai pro álbum de família.',
  'Momento histórico! Vou contar pros outros patos.',
  'Você fez algo raro hoje. Estou orgulhoso!',
  'Isso merece uma dancinha. Olha só!',
  'Guardei esse dia no meu cantinho favorito.',
];

export function rareLine(random = Math.random) {
  return rareLines[Math.floor(random() * rareLines.length)];
}
