import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { PixelImage } from '../../../shared/ui/PixelImage';
import { useTheme, useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../../shared/theme/tokens';
import { coinIcon, itemImage, type ItemStatus, type ShopItem } from '../domain/catalog';

type ShopItemCardProps = {
  item: ShopItem;
  /** Preço mostrado na loja; a mochila mostra a quantidade. */
  price?: number;
  quantity?: number;
  equipped?: boolean;
  /** Na loja, sem moedas suficientes: o preço fica em vermelho e o botão explica. */
  unaffordable?: boolean;
  /** Na loja: Possuído, Disponível ou Bloqueado (com o nível), em texto além da cor. */
  status?: ItemStatus;
  actionLabel: string;
  actionVariant?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
  onAction: () => void;
};

export function CoinAmount({ value, size = 18, muted }: { value: number; size?: number; muted?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.coin} accessible accessibilityLabel={`${value} ${value === 1 ? 'moeda' : 'moedas'}`}>
    <PixelImage source={coinIcon} size={size} />
    <Text style={[styles.coinValue, muted && styles.coinMuted, { fontSize: size - 3, lineHeight: size + 2 }]}>{value}</Text>
  </View>;
}

/** O item em pixel art é o protagonista; o cartão moderno organiza nome, efeito, preço e ação. */
const statusBadge: Record<ItemStatus, { tone: 'success' | 'neutral' | 'danger'; label: (item: ShopItem) => string }> = {
  owned: { tone: 'success', label: () => 'Possuído' },
  available: { tone: 'neutral', label: () => 'Disponível' },
  locked: { tone: 'danger', label: (item) => `Bloqueado · nível ${item.minLevel ?? 1}` },
};

export function ShopItemCard({ item, price, quantity, equipped, unaffordable, status, actionLabel, actionVariant = 'primary', disabled, onAction }: ShopItemCardProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const locked = status === 'locked';
  const scene = item.slot === 'background';
  const image = itemImage(item.sku);
  return <View style={[styles.card, scene && styles.sceneCard, equipped && styles.equipped]}>
    <View style={locked && styles.lockedArt}>
      {image ? scene
        ? <Image source={image} style={styles.scene} resizeMode="cover" accessibilityIgnoresInvertColors />
        : <View style={styles.stage}><PixelImage source={image} size={80} /></View>
        : null}
      {locked ? <View style={styles.lock}><Ionicons name="lock-closed" size={22} color={colors.text} /></View> : null}
    </View>
    <View style={styles.header}>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      {quantity !== undefined && item.consumable ? <Badge tone="neutral">x{quantity}</Badge> : null}
      {equipped ? <Badge tone="primary">Em uso</Badge> : null}
      {status ? <Badge tone={statusBadge[status].tone}>{statusBadge[status].label(item)}</Badge> : null}
    </View>
    <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
    <View style={[styles.footer, scene && styles.sceneFooter]}>
      {price !== undefined ? <CoinAmount value={price} muted={unaffordable} /> : null}
      <View style={scene ? styles.sceneAction : styles.action}>
        <Button label={actionLabel} variant={actionVariant} size="compact" onPress={onAction} disabled={disabled} />
      </View>
    </View>
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  // flexShrink e minWidth: sem eles a largura própria da imagem empurra o card para fora da tela.
  card: { flexBasis: '47%', flexGrow: 1, flexShrink: 1, minWidth: 0, gap: spacing.sm, padding: spacing.ms, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  sceneCard: { flexBasis: '100%' },
  equipped: { borderColor: colors.primary, borderWidth: 2 },
  stage: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  scene: { width: '100%', height: undefined, aspectRatio: 2, borderRadius: radius.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  name: { ...typography.subheading, color: colors.text, flexShrink: 1 },
  description: { ...typography.caption, fontFamily: typography.bodySm.fontFamily, color: colors.textSecondary, flexGrow: 1 },
  footer: { gap: spacing.sm },
  sceneFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sceneAction: { flexGrow: 1, maxWidth: 200 },
  action: { alignSelf: 'stretch' },
  coin: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedArt: { opacity: 0.55 },
  lock: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  coinValue: { ...typography.numeric, color: colors.rewardText },
  coinMuted: { color: colors.danger },
});
