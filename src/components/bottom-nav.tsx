import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '@/contexts/cart-context';
import { useAppTheme } from '@/contexts/theme-context';
import { getAuthState } from '@/lib/api';

const destinations = [
  { label: 'Home', path: '/', icon: { ios: 'house', android: 'home', web: 'home' } },
  { label: 'Cart', path: '/cart', icon: { ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' } },
  { label: 'Orders', path: '/orders', icon: { ios: 'doc.text', android: 'receipt_long', web: 'receipt_long' } },
  { label: 'Profile', path: '/profile', icon: { ios: 'person.crop.circle', android: 'person', web: 'person' } },
] as const;
const signInDestination = {
  label: 'Sign In',
  path: '/login',
  icon: { ios: 'person.crop.circle.badge.checkmark', android: 'login', web: 'login' },
} as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { itemCount } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    getAuthState()
      .then((auth) => { if (active) setIsAuthenticated(Boolean(auth?.token)); })
      .catch(() => { if (active) setIsAuthenticated(false); });
    return () => { active = false; };
  }, [pathname]);

  if (Platform.OS === 'web' && width >= 768) return null;

  const visibleDestinations = isAuthenticated
    ? destinations
    : [destinations[0], signInDestination];

  return (
    <View style={[styles.bar, { backgroundColor: colors.tab, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 6) }]}>
      {visibleDestinations.map((destination) => {
        const isActive = pathname === destination.path
          || (destination.path !== '/' && pathname.startsWith(`${destination.path}/`));
        const tintColor = isActive ? colors.primary : colors.tabInactive;
        return (
          <Pressable
            key={destination.path}
            accessibilityRole="link"
            accessibilityLabel={destination.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => router.push(destination.path as never)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <View style={styles.iconWrap}>
              <SymbolView name={destination.icon} tintColor={tintColor} size={22} />
              {destination.label === 'Cart' && itemCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 72,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: 14,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderRadius: 8,
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});