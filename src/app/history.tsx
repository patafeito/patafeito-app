import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { loadReportData } from '../features/reports/application/load-report-data';
import { BarChart, Heatmap } from '../features/reports/components/Charts';
import { completedByDay, monthHeatmap, totals, weeklyTasks } from '../features/reports/domain/aggregate';
import { useLocalData } from '../shared/hooks/use-local-data';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { EmptyState } from '../shared/ui/EmptyState';
import { SectionHeader } from '../shared/ui/Headers';
import { IconButton } from '../shared/ui/IconButton';
import { Screen } from '../shared/ui/Screen';
import { TaskItem } from '../shared/ui/TaskItem';
import { useTheme, useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../shared/theme/tokens';

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours}h${String(minutes % 60).padStart(2, '0')}` : `${hours}h`;
}

/** Histórico e produtividade (Tela 11, HU25): totais, semana, mês e tarefas concluídas. */
export default function HistoryScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data } = useLocalData(loadReportData);
  const [month, setMonth] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));

  if (!data) return <Screen edges={['left', 'right']}><Text style={styles.muted}>Carregando…</Text></Screen>;

  const summary = totals(data, data.xpTotal);
  const week = weeklyTasks(data.tasks);
  const heatmap = monthHeatmap(data.tasks, month.year, month.month);
  const groups = completedByDay(data.tasks);
  const monthName = new Date(month.year, month.month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const isCurrentMonth = month.year === new Date().getFullYear() && month.month === new Date().getMonth();

  function shiftMonth(delta: number) {
    setMonth(({ year, month: current }) => {
      const date = new Date(year, current + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  return <Screen edges={['left', 'right']}>
    <View style={styles.grid}>
      <StatCard icon="checkmark-circle" label="Tarefas concluídas" value={String(summary.tasksCompleted)} />
      <StatCard icon="timer" label="Tempo focado" value={formatMinutes(summary.focusMinutes)} />
      <StatCard icon="flame" label="Dias seguidos" value={String(summary.streak)} />
      <StatCard icon="sparkles" label="XP total" value={String(summary.xpTotal)} />
    </View>

    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Produtividade semanal</Text>
      <BarChart title="Tarefas concluídas por dia nesta semana" data={week} unit="tarefas" />
    </Card>

    <Card style={styles.card}>
      <View style={styles.monthHeader}>
        <IconButton icon="chevron-back" label="Mês anterior" tone="plain" onPress={() => shiftMonth(-1)} />
        <Text style={styles.cardTitle}>Atividade de {monthName}</Text>
        {isCurrentMonth ? <View style={styles.spacer} /> : <IconButton icon="chevron-forward" label="Próximo mês" tone="plain" onPress={() => shiftMonth(1)} />}
      </View>
      <Heatmap title={`Atividade de ${monthName}`} weeks={heatmap} />
    </Card>

    <Button label="Ver relatórios detalhados" icon="stats-chart" variant="secondary" onPress={() => router.push('/reports')} />

    <SectionHeader title="Concluídas nos últimos 30 dias" />
    {groups.length ? groups.map((group) => <View key={group.date.toDateString()} style={styles.group}>
      <Text style={styles.groupTitle}>{group.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      {group.tasks.map((task) => <TaskItem key={task.id} task={task} />)}
    </View>)
      : <EmptyState species="pingo" title="Nada por aqui ainda" message="As tarefas que você concluir aparecem neste histórico." />}
  </Screen>;
}

function StatCard({ icon, label, value }: { icon: ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
    <Ionicons name={icon} size={20} color={colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  muted: { ...typography.body, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: { flexBasis: '47%', flexGrow: 1, gap: 2, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  statValue: { ...typography.numeric, fontSize: 22, lineHeight: 28, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  card: { gap: spacing.md },
  cardTitle: { ...typography.heading, color: colors.text, flexShrink: 1, textAlign: 'center' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  spacer: { width: 44 },
  group: { gap: spacing.sm },
  groupTitle: { ...typography.label, color: colors.textSecondary, textTransform: 'capitalize' },
});
