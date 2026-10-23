import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError, NetworkError } from '../../../shared/network/api-client';
import { colors, radius, spacing, typography } from '../../../shared/theme/tokens';
import { celebrate } from '../../pet/application/pet-mood';
import { itemImage, type InventoryRow, type ShopItem } from '../domain/catalog';
import { consumeItem } from '../infrastructure/shop-repository';

type FoodTrayProps = { foods: { item: ShopItem; row: InventoryRow }[]; onFed: () => void };

/** Comidas da mochila, prontas para dar ao pato com um toque. */
export function FoodTray({ foods, onFed }: FoodTrayProps) {
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function feed(item: ShopItem) {
    setBusy(item.id);
    try {
      await consumeItem(item.id);
      celebrate('eating', { message: 'Nhac! Que delícia.' });
      setMessage(undefined);
      onFed();
    } catch (error) {
      if (error instanceof NetworkError) setMessage('Precisamos de conexão para alimentar o pato.');
      else setMessage(error instanceof ApiError ? error.message : 'Não foi possível alimentar agora.');
    } finally {
      setBusy(undefined);
    }
  }

  if (!foods.length) return <Text style={styles.muted}>Sem comida na mochila. Compre na loja.</Text>;

  return <View style={styles.container}>
    <View style={styles.row}>
      {foods.map(({ item, row }) => {
        const image = itemImage(item.sku);
        return <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`Dar ${item.name} ao pato, ${row.quantity} na mochila`}
          disabled={busy !== undefined}
          onPress={() => void feed(item)}
          style={({ pressed }) => [styles.food, pressed && styles.pressed, busy === item.id && styles.busy]}
        >
          {image ? <Image source={image} style={styles.icon} accessibilityIgnoresInvertColors /> : null}
          <Text style={styles.quantity}>x{row.quantity}</Text>
        </Pressable>;
      })}
    </View>
    {message ? <Text style={styles.error}>{message}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  food: { alignItems: 'center', padding: spacing.xs, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.borderSubtle, minWidth: 64 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  busy: { opacity: 0.5 },
  icon: { width: 44, height: 44 },
  quantity: { ...typography.numeric, color: colors.text, fontSize: 12 },
  muted: { ...typography.body, color: colors.textMuted, fontSize: 14 },
  error: { ...typography.body, color: colors.danger, fontSize: 13 },
});
