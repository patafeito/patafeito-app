import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { weekdayLabels } from '../../features/tasks/domain/recurrence';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { spacing, typography } from '../theme/tokens';

type WeekDotsProps = { days: { date: Date; scheduled: boolean; done: boolean }[] };

/** Últimos 7 dias de um hábito: cheio = feito, contorno = previsto e não feito, apagado = não previsto. */
export function WeekDots({ days }: WeekDotsProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const done = days.filter((day) => day.done).length;
  const planned = days.filter((day) => day.scheduled).length;
  return <View style={styles.row} accessible accessibilityLabel={`Feito em ${done} de ${planned} dias previstos na última semana`}>
    {days.map((day, index) => {
      const today = index === days.length - 1;
      return <View key={day.date.toDateString()} style={styles.day}>
        <View style={[styles.dot, day.scheduled && styles.scheduled, day.done && styles.done, today && !day.done && styles.today]}>
          {day.done ? <Ionicons name="checkmark" size={14} color={colors.onPrimary} /> : null}
        </View>
        <Text style={[styles.label, today && styles.labelToday]}>{weekdayLabels[day.date.getDay()].slice(0, 1)}</Text>
      </View>;
    })}
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  day: { alignItems: 'center', gap: 2, flex: 1 },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  scheduled: { borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: 'transparent' },
  done: { backgroundColor: colors.success, borderColor: colors.success },
  today: { borderColor: colors.primary, borderStyle: 'dashed' },
  label: { ...typography.caption, color: colors.textSecondary },
  labelToday: { color: colors.text, fontFamily: typography.label.fontFamily },
});
