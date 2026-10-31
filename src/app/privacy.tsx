import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';
import { useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { spacing, typography } from '../shared/theme/tokens';

const sections: { title: string; items: string[] }[] = [
  {
    title: 'O que coletamos',
    items: [
      'Conta: nome, e-mail e senha. A senha é guardada só como hash (Argon2id); ninguém consegue lê-la.',
      'Uso do app: tarefas (título, descrição, categoria, prazo e conclusão), ciclos de foco, seu pato e os itens da loja.',
      'Progresso: XP, moedas, sequência de dias e notificações geradas pelo app.',
      'Social: se você adicionar amigos, eles veem seu nome, @usuário, pato, nível, sequência e XP da semana. Seu e-mail nunca é mostrado.',
    ],
  },
  {
    title: 'O que não coletamos',
    items: [
      'Localização, contatos, fotos, câmera ou microfone.',
      'Uso de outros aplicativos: o modo foco só percebe se você saiu do Patafeito, sem ver para onde foi.',
      'Publicidade ou rastreamento de terceiros.',
    ],
  },
  {
    title: 'Para que usamos',
    items: [
      'Fazer o app funcionar: guardar sua rotina, calcular XP e moedas e cuidar do pato.',
      'Sincronizar seus dados entre o aparelho e o servidor, inclusive depois de usar sem internet.',
      'Mostrar lembretes de prazos e do estado do pato.',
    ],
  },
  {
    title: 'Onde ficam',
    items: [
      'No seu aparelho, num banco local, para o app funcionar offline. O login fica no armazenamento seguro do sistema.',
      'No servidor do Patafeito, com comunicação criptografada (HTTPS).',
    ],
  },
  {
    title: 'Seus direitos',
    items: [
      'Ver e corrigir seus dados: em Perfil → Conta.',
      'Zerar o progresso: em Perfil → Zona de cuidado → Resetar progresso.',
      'Excluir a conta: em Perfil → Zona de cuidado → Excluir conta. A exclusão é definitiva e apaga todos os seus dados do servidor e do aparelho (LGPD, art. 18).',
      'Sair da conta apaga os dados guardados neste aparelho.',
    ],
  },
];

/** RNF13: o que o app coleta, por quê, onde guarda e como excluir. */
export default function PrivacyScreen() {
  const styles = useThemedStyles(makeStyles);
  return <Screen edges={['left', 'right', 'bottom']}>
    <Text style={styles.intro}>O Patafeito coleta só o necessário para organizar sua rotina e cuidar do seu pato.</Text>
    {sections.map((section) => <Card key={section.title} style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">{section.title}</Text>
      {section.items.map((item) => <View key={item} style={styles.item}>
        <Text style={styles.bullet}>•</Text>
        <Text style={styles.text}>{item}</Text>
      </View>)}
    </Card>)}
  </Screen>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  intro: { ...typography.body, color: colors.textSecondary, paddingTop: spacing.md },
  card: { gap: spacing.sm },
  title: { ...typography.heading, color: colors.text },
  item: { flexDirection: 'row', gap: spacing.sm },
  bullet: { ...typography.body, color: colors.primary },
  text: { ...typography.body, color: colors.text, flex: 1 },
});
