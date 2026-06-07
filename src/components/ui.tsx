import React from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, type, shadow } from '../theme';

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inner = (
    <View style={[{ padding: spacing.lg, gap: spacing.md }, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

export function H1({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.h1, style]}>{children}</Text>;
}
export function H2({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.h2, style]}>{children}</Text>;
}
export function Body({
  children,
  dim,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  dim?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return (
    <Text style={[s.body, dim && { color: colors.textDim }, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}
export function Label({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.label, style]}>{children}</Text>;
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s.card, shadow.card, pressed && { opacity: 0.85 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, shadow.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.section}>{children}</Text>
      {right}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && s.btnPrimary,
        variant === 'ghost' && s.btnGhost,
        variant === 'danger' && s.btnDanger,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <Text
        style={[
          s.btnText,
          variant === 'primary' && { color: colors.bg },
          variant === 'ghost' && { color: colors.text },
          variant === 'danger' && { color: '#fff' },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, active ? s.chipActive : null]}
    >
      <Text style={[s.chipText, active ? { color: colors.bg } : null]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ label, tone = 'info' }: { label: string; tone?: 'win' | 'loss' | 'warn' | 'info' }) {
  const map = { win: colors.win, loss: colors.loss, warn: colors.warn, info: colors.info };
  return (
    <View style={[s.pill, { borderColor: map[tone] }]}>
      <Text style={[s.pillText, { color: map[tone] }]}>{label}</Text>
    </View>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: 'win' | 'loss' }) {
  const color = tone === 'win' ? colors.win : tone === 'loss' ? colors.loss : colors.text;
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={s.divider} />;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyBody}>{body}</Text>
    </View>
  );
}

export function Banner({
  text,
  tone = 'warn',
}: {
  text: string;
  tone?: 'warn' | 'info' | 'loss';
}) {
  const map = { warn: colors.warn, info: colors.info, loss: colors.loss };
  return (
    <View style={[s.banner, { borderColor: map[tone], backgroundColor: map[tone] + '18' }]}>
      <Text style={[s.bannerText, { color: map[tone] }]}>{text}</Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Label>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        style={[s.input, multiline && { height: 90, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.segmented}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[s.segment, value === o.value && s.segmentActive]}
        >
          <Text style={[s.segmentText, value === o.value && { color: colors.bg }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, style]}>{children}</View>;
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 2 }}>
      {children}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  h1: { ...type.title, color: colors.text },
  h2: { ...type.section, color: colors.text },
  body: { ...type.body, color: colors.text },
  label: { ...type.label, color: colors.textDim, textTransform: 'uppercase' },
  section: { ...type.section, color: colors.accent },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  btn: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.accent },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btnDanger: { backgroundColor: colors.loss },
  btnText: { ...type.bodySemi, fontSize: 16 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { ...type.small, color: colors.textDim, fontFamily: fonts.bodySemi },
  pill: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1, alignSelf: 'flex-start' },
  pillText: { ...type.tiny, fontFamily: fonts.bodySemi, textTransform: 'uppercase', letterSpacing: 0.5 },
  stat: { flex: 1, gap: 2 },
  statValue: { ...type.section, fontSize: 22, color: colors.text },
  statLabel: { ...type.tiny, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyTitle: { ...type.section, color: colors.text },
  emptyBody: { ...type.body, color: colors.textDim, textAlign: 'center' },
  banner: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  bannerText: { ...type.small, fontFamily: fonts.bodySemi },
  input: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.text, ...type.body },
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 3, borderWidth: 1, borderColor: colors.border },
  segment: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { ...type.small, fontFamily: fonts.bodySemi, color: colors.textDim },
});
