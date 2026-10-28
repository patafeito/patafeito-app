/**
 * Paleta semântica do Patafeito: um lago acolhedor (água, vegetação, madeira, areia e sol).
 * Saturação só nos papéis: interação (primary), recompensa (reward), celebração (achievement) e hábito (success).
 * Contraste conferido com WCAG AA: textos ≥ 4.5:1 nas superfícies; `on*Soft` ≥ 4.5:1 sobre o fundo suave.
 */
export type Palette = {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  onPrimarySoft: string;
  secondary: string;
  tertiary: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  /** Separação decorativa de cards. */
  border: string;
  /** Contorno de controles (campos, chips): ≥ 3:1 sobre a superfície. */
  borderStrong: string;
  divider: string;
  /** Marrom dos contornos da pixel art, para molduras de itens. */
  outlinePixel: string;
  success: string;
  successSoft: string;
  onSuccessSoft: string;
  warning: string;
  warningSoft: string;
  onWarningSoft: string;
  danger: string;
  dangerSoft: string;
  onDangerSoft: string;
  /** Preenchimento de XP e moedas (barra, brilho). */
  reward: string;
  /** Texto de XP e moedas: no claro, o dourado escurece para ser lido. */
  rewardText: string;
  rewardSoft: string;
  achievement: string;
  backdrop: string;
  shadow: string;
};

export const darkPalette: Palette = {
  background: '#10233A',
  backgroundSecondary: '#0C1B2E',
  surface: '#1A3350',
  surfaceElevated: '#234264',
  surfaceMuted: '#152B45',
  primary: '#42B9D4',
  primaryPressed: '#2F9DB8',
  onPrimary: '#10233A',
  primarySoft: '#1B506B',
  onPrimarySoft: '#8FDAEC',
  secondary: '#284864',
  tertiary: '#F0846B',
  text: '#F3F8FC',
  textSecondary: '#B9CAD9',
  textDisabled: '#6F87A0',
  border: '#2C4D6B',
  borderStrong: '#6688A8',
  divider: '#284B66',
  outlinePixel: '#493326',
  success: '#56B98A',
  successSoft: '#1C4C41',
  onSuccessSoft: '#8ED8B2',
  warning: '#F7C948',
  warningSoft: '#5A4B1B',
  onWarningSoft: '#FFD866',
  danger: '#F79C86',
  dangerSoft: '#543B3E',
  onDangerSoft: '#FAB5A3',
  reward: '#F7C948',
  rewardText: '#F7C948',
  rewardSoft: '#5A4B1B',
  achievement: '#F0846B',
  backdrop: 'rgba(5, 14, 26, 0.72)',
  shadow: '#081624',
};

export const lightPalette: Palette = {
  background: '#FBF4E6',
  backgroundSecondary: '#F3E7CF',
  surface: '#FFFBF2',
  surfaceElevated: '#FFFDF8',
  surfaceMuted: '#F1E6CF',
  primary: '#17788F',
  primaryPressed: '#11627A',
  onPrimary: '#FFFFFF',
  primarySoft: '#D6EEF3',
  onPrimarySoft: '#0E5A6E',
  secondary: '#284864',
  tertiary: '#B8472F',
  text: '#10233A',
  textSecondary: '#4A6178',
  textDisabled: '#9AA9B6',
  border: '#E6D7B9',
  borderStrong: '#9A8460',
  divider: '#EADFC8',
  outlinePixel: '#493326',
  success: '#2E7D57',
  successSoft: '#DDF1E6',
  onSuccessSoft: '#1F6646',
  warning: '#8A6100',
  warningSoft: '#FDF0C4',
  onWarningSoft: '#7A5500',
  danger: '#B8472F',
  dangerSoft: '#FBE1DA',
  onDangerSoft: '#8F3522',
  reward: '#F7C948',
  rewardText: '#8A6100',
  rewardSoft: '#FDF0C4',
  achievement: '#B8472F',
  backdrop: 'rgba(16, 35, 58, 0.45)',
  shadow: '#493326',
};
