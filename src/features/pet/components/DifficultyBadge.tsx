import { Badge } from '../../../shared/ui/Badge';
import { careDifficulty, DIFFICULTY_LABEL, type CareDifficulty } from '../domain/stats';

const tone = { easy: 'success', medium: 'experience', hard: 'danger' } as const satisfies Record<CareDifficulty, string>;

/** Selo da dificuldade de cuidado do pato: quão rápido os status caem e quanto cada cuidado rende. */
export function DifficultyBadge({ speciesId }: { speciesId: string | null | undefined }) {
  const difficulty = careDifficulty(speciesId);
  return <Badge tone={tone[difficulty]}>{`Cuidado ${DIFFICULTY_LABEL[difficulty].toLowerCase()}`}</Badge>;
}
