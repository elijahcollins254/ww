import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useAppTheme } from '@/contexts/theme-context';

export function FeatureCard({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  return <View style={{ marginTop: 14, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12 }}>{children}</View>;
}

export function FeatureLink({ title, subtitle, href }: { title: string; subtitle?: string; href: string }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={() => router.push(href as never)} style={({ pressed }) => [styles.link, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={styles.linkCopy}>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{title}</Text>
        {subtitle ? <Text style={{ marginTop: 4, color: colors.muted, fontSize: 12, lineHeight: 17 }}>{subtitle}</Text> : null}
      </View>
      <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '800' }}>›</Text>
    </Pressable>
  );
}

export function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return `KSh ${Number.isFinite(amount) ? amount.toLocaleString('en-KE', { maximumFractionDigits: 0 }) : '0'}`;
}

const styles = StyleSheet.create({
  link: { minHeight: 60, marginTop: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10 },
  linkCopy: { flex: 1, paddingRight: 12 },
  pressed: { opacity: 0.7 },
});
