import { useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppTheme, type ThemeMode } from '@/contexts/theme-context';

const mobileApps = [
  { label: 'Book pickup', short: '+', path: '/book', color: '#E10613' },
  { label: 'Your orders', short: 'O', path: '/orders', color: '#16A34A' },
  { label: 'Your cart', short: 'C', path: '/cart', color: '#3B82F6' },
  { label: 'Profile', short: 'P', path: '/profile', color: '#F97316' },
  { label: 'Pay later', short: 'K', path: '/bnpl', color: '#8B5CF6' },
  { label: 'Services', short: 'S', path: '/services', color: '#0F766E' },
  { label: 'Offers', short: '%', path: '/offers', color: '#DB2777' },
  { label: 'My loans', short: 'L', path: '/loans', color: '#2563EB' },
  { label: 'Borrow', short: '+', path: '/borrow', color: '#7C3AED' },
  { label: 'Trade in', short: 'T', path: '/tradein', color: '#16A34A' },
  { label: 'Payments', short: '$', path: '/financing', color: '#B45309' },
  { label: 'Contact', short: '?', path: '/contact', color: '#475569' },
  { label: 'BNPL guide', short: 'i', path: '/help-bnpl', color: '#9333EA' },
];

export default function AppHeader() {
  const insets = useSafeAreaInsets();
  const { colors, mode, setMode } = useAppTheme();
  const styles = createStyles(colors);
  const [appsOpen, setAppsOpen] = useState(false);

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="link" accessibilityLabel="Wild Wash home" onPress={() => router.push('/')}>
          <Image source={require('@/assets/images/ww logo.png')} style={styles.brandMark} contentFit="contain" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={appsOpen ? 'Close apps' : 'Open apps'}
          accessibilityState={{ expanded: appsOpen }}
          onPress={() => setAppsOpen((open) => !open)}
          style={styles.menuButton}>
          <View style={styles.gridIcon}>
            <View style={styles.gridSquare} /><View style={styles.gridSquare} />
            <View style={styles.gridSquare} /><View style={styles.gridSquare} />
          </View>
        </Pressable>
      </View>

      {appsOpen && (
        <View style={styles.appsMenu}>
          <View style={styles.appsGrid}>
            {mobileApps.map((app) => (
              <Pressable
                key={app.path}
                accessibilityRole="link"
                onPress={() => {
                  setAppsOpen(false);
                  router.push(app.path as never);
                }}
                style={({ pressed }) => [styles.appLink, pressed && styles.pressed]}>
                <Text style={[styles.appLinkIcon, { color: app.color }]}>{app.short}</Text>
                <Text numberOfLines={1} style={styles.appLinkText}>{app.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.menuDivider} />
          <Text style={styles.appearanceLabel}>Appearance</Text>
          <View style={styles.themeOptions}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: mode === option }}
                onPress={() => setMode(option)}
                style={[styles.themeOption, mode === option && styles.themeOptionActive]}>
                <Text style={[styles.themeOptionText, mode === option && styles.themeOptionTextActive]}>
                  {option[0].toUpperCase() + option.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: (typeof Colors)[keyof typeof Colors]) {
  return StyleSheet.create({
    header: { zIndex: 10, backgroundColor: colors.header, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    topBar: { height: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
    brandMark: { width: 48, height: 48 },
    menuButton: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    gridIcon: { width: 21, height: 21, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
    gridSquare: { width: 8, height: 8, borderWidth: 1.5, borderColor: colors.text, borderRadius: 1 },
    appsMenu: { marginHorizontal: 16, marginBottom: 12, padding: 16, backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1, borderRadius: 12, elevation: 12 },
    appsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    appLink: { width: '31.5%', minHeight: 82, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 10, backgroundColor: colors.chip, borderRadius: 8 },
    appLinkIcon: { marginBottom: 5, fontSize: 23, fontWeight: '800' },
    appLinkText: { color: colors.text, fontSize: 11, fontWeight: '600' },
    menuDivider: { height: 1, marginTop: 14, marginBottom: 12, backgroundColor: colors.border },
    appearanceLabel: { marginBottom: 9, color: colors.text, fontSize: 13, fontWeight: '700' },
    themeOptions: { flexDirection: 'row', padding: 3, backgroundColor: colors.chip, borderRadius: 10 },
    themeOption: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    themeOptionActive: { backgroundColor: colors.primary },
    themeOptionText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    themeOptionTextActive: { color: '#FFFFFF' },
    pressed: { opacity: 0.75 },
  });
}