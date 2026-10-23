import type { ImageSourcePropType } from 'react-native';

export type ShopCategory = 'food' | 'power' | 'background';
export type ItemEffect =
  | { type: 'stats'; hunger?: number; energy?: number; happiness?: number }
  | { type: 'double_xp'; hours: number }
  | { type: 'double_coins'; hours: number }
  | { type: 'focus_double' }
  | { type: 'streak_shield' }
  | { type: 'background' }
  | { type: 'none' };

export type ShopItem = {
  id: string;
  sku: string;
  name: string;
  description: string;
  slot: string;
  priceCoins: number;
  consumable: boolean;
  effect: ItemEffect;
};

export type InventoryRow = { id: string; itemId: string; equipped: boolean; quantity: number; acquiredAt: string };
export type ActiveBoost = { effect: string; expiresAt: string | null; usesLeft: number | null };
export type Boosts = { active: ActiveBoost[]; protectedDates: string[] };

export const categories: { value: ShopCategory; label: string }[] = [
  { value: 'food', label: 'Comidas' },
  { value: 'power', label: 'Poderes' },
  { value: 'background', label: 'Cenários' },
];

/** Ícones recortados por `npm run shop-assets`; o sku do servidor é o nome do arquivo. */
const icons: Record<string, ImageSourcePropType> = {
  'food-bread': require('../../../../assets/shop/food-bread.png'),
  'food-corn': require('../../../../assets/shop/food-corn.png'),
  'food-lettuce': require('../../../../assets/shop/food-lettuce.png'),
  'food-watermelon': require('../../../../assets/shop/food-watermelon.png'),
  'food-fish': require('../../../../assets/shop/food-fish.png'),
  'food-cupcake': require('../../../../assets/shop/food-cupcake.png'),
  'power-energy-coffee': require('../../../../assets/shop/power-energy-coffee.png'),
  'power-focus-hourglass': require('../../../../assets/shop/power-focus-hourglass.png'),
  'power-lucky-clover': require('../../../../assets/shop/power-lucky-clover.png'),
  'power-double-xp': require('../../../../assets/shop/power-double-xp.png'),
  'power-streak-shield': require('../../../../assets/shop/power-streak-shield.png'),
  'scene-lago': require('../../../../assets/shop/scene-lago.jpg'),
  'scene-biblioteca': require('../../../../assets/shop/scene-biblioteca.jpg'),
  'scene-cafe': require('../../../../assets/shop/scene-cafe.jpg'),
  'scene-praia': require('../../../../assets/shop/scene-praia.jpg'),
  'scene-noite': require('../../../../assets/shop/scene-noite.jpg'),
};

export const coinIcon: ImageSourcePropType = require('../../../../assets/shop/coin.png');
export const coinStackIcon: ImageSourcePropType = require('../../../../assets/shop/coin-stack.png');

export function itemImage(sku: string): ImageSourcePropType | undefined {
  return icons[sku];
}

/** Só mostra o que o app sabe desenhar: itens novos do servidor sem arte ficam escondidos. */
export function isShowable(item: ShopItem) {
  return item.slot in { food: 1, power: 1, background: 1 } && !!icons[item.sku];
}

export function boostLabel(boost: ActiveBoost, now = new Date()) {
  const until = boost.expiresAt ? new Date(boost.expiresAt) : undefined;
  const time = until ? until.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  if (boost.effect === 'double_xp') return `XP em dobro até ${time}`;
  if (boost.effect === 'double_coins') return `Moedas em dobro até ${time}`;
  if (boost.effect === 'focus_double') return 'Próximo ciclo de foco vale o dobro';
  return until && until > now ? `Ativo até ${time}` : 'Ativo';
}

/** Dia local no formato AAAA-MM-DD, como o escudo da sequência espera. */
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
