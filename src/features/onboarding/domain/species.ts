import { colors } from '../../../shared/theme/tokens';

export type SpeciesId = 'pingo' | 'mare' | 'bento';

export type Species = {
  id: SpeciesId;
  name: string;
  tagline: string;
  personality: string;
  indicatedFor: string;
  mission: string;
  recommendation: string;
  accent: string;
};

export const speciesList: Species[] = [
  {
    id: 'pingo',
    name: 'Pingo',
    tagline: 'o iniciador',
    personality: 'Curioso, energético e encorajador.',
    indicatedFor: 'Para quem quer vencer a inércia.',
    mission: 'Conclua uma tarefa de até 15 minutos.',
    recommendation: 'Comece por aqui',
    accent: colors.experience,
  },
  {
    id: 'mare',
    name: 'Maré',
    tagline: 'o concentrado',
    personality: 'Tranquilo, sereno e concentrado.',
    indicatedFor: 'Para quem quer trabalhar em blocos de foco.',
    mission: 'Complete um ciclo de foco de 25 minutos.',
    recommendation: 'Seu próximo foco',
    accent: colors.primary,
  },
  {
    id: 'bento',
    name: 'Bento',
    tagline: 'o consistente',
    personality: 'Organizado, paciente e confiável.',
    indicatedFor: 'Para quem quer construir rotina.',
    mission: 'Conclua uma tarefa recorrente hoje.',
    recommendation: 'Proteja sua sequência',
    accent: colors.success,
  },
];

export function speciesById(id: string | undefined): Species {
  return speciesList.find((species) => species.id === id) ?? speciesList[0];
}
