import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useCart } from '@/contexts/cart-context';
import { useAppTheme } from '@/contexts/theme-context';

function money(amount: number) {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}

export default function CartScreen() {
  const { items, subtotal, setQuantity, removeItem, clearCart } = useCart();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.page}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Cart</Text>
          {items.length > 0 && <Pressable onPress={clearCart}><Text style={styles.clearButton}>CLEAR CART</Text></Pressable>}
        </View>
        <Text style={styles.subtitle}>{items.length ? `${items.length} service${items.length === 1 ? '' : 's'} selected` : 'Ready when you are.'}</Text>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyBadgeWrap}>
              <View style={styles.emptyMark}><Text style={styles.emptyMarkText}>WW</Text></View>
            </View>
            <Text style={styles.emptyTitle}>Nothing in the bag yet</Text>
            <Text style={styles.emptyCopy}>Choose a service and we’ll take it from here.</Text>
            <Link href="/" asChild>
              <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
                <Text style={styles.primaryButtonText}>Browse services</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.items}>
              {items.map(({ service, quantity }) => (
                <View key={service.id} style={styles.itemRow}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemName}>{service.name}</Text>
                    <Text style={styles.itemCategory}>{(service.category || 'Care').replaceAll('-', ' ')}</Text>
                    <Text style={styles.itemPrice}>{money(Number(service.price))}</Text>
                  </View>
                  <View style={styles.controls}>
                    <View style={styles.stepper}>
                      <Pressable accessibilityLabel={`Decrease ${service.name} quantity`} onPress={() => setQuantity(service.id, quantity - 1)} style={styles.stepButton}><Text style={styles.stepText}>−</Text></Pressable>
                      <Text style={styles.quantity}>{quantity}</Text>
                      <Pressable accessibilityLabel={`Increase ${service.name} quantity`} onPress={() => setQuantity(service.id, quantity + 1)} style={styles.stepButton}><Text style={styles.stepText}>+</Text></Pressable>
                    </View>
                    <Pressable onPress={() => removeItem(service.id)}><Text style={styles.removeButton}>REMOVE</Text></Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.summary}>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Estimated subtotal</Text><Text style={styles.summaryValue}>{money(subtotal)}</Text></View>
              <Text style={styles.estimateNote}>Final price is confirmed by our team before payment.</Text>
              <Link href="/book" asChild><Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Book / schedule pickup</Text></Pressable></Link>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: (typeof Colors)[keyof typeof Colors]) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.header },
    page: { flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center', paddingHorizontal: 20, backgroundColor: colors.background },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
    clearButton: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
    title: { color: colors.text, fontSize: 29, fontWeight: '900' },
    subtitle: { marginTop: 5, marginBottom: 18, color: colors.muted, fontSize: 13 },
    items: { gap: 10, paddingBottom: 16 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, padding: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 4 },
    itemMain: { flex: 1 },
    itemName: { color: colors.text, fontSize: 15, fontWeight: '700' },
    itemCategory: { marginTop: 4, color: colors.muted, fontSize: 11, textTransform: 'capitalize' },
    itemPrice: { marginTop: 9, color: colors.primary, fontSize: 13, fontWeight: '800' },
    controls: { justifyContent: 'space-between', alignItems: 'flex-end' },
    stepper: { flexDirection: 'row', alignItems: 'center', height: 34, borderWidth: 1, borderColor: colors.border, borderRadius: 3 },
    stepButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    stepText: { color: colors.primary, fontSize: 18, fontWeight: '700' },
    quantity: { minWidth: 22, color: colors.text, textAlign: 'center', fontSize: 12, fontWeight: '700' },
    removeButton: { paddingTop: 9, color: colors.muted, fontSize: 9, fontWeight: '700' },
    summary: { paddingTop: 15, paddingBottom: 15, borderTopWidth: 1, borderTopColor: colors.border },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
    summaryValue: { color: colors.text, fontSize: 17, fontWeight: '900' },
    estimateNote: { marginTop: 6, marginBottom: 14, color: colors.muted, fontSize: 11 },
    primaryButton: {
      minHeight: 50,
      paddingHorizontal: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      width: '100%',
      maxWidth: 320,
      shadowColor: '#E10613',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    primaryButtonPressed: { opacity: 0.88 },
    primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingBottom: 70,
      gap: 12,
    },
    emptyBadgeWrap: {
      padding: 18,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 30,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },
    emptyMark: {
      width: 96,
      height: 96,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSelected,
      borderRadius: 48,
    },
    emptyMarkText: { color: colors.primary, fontSize: 30, fontWeight: '900' },
    emptyTitle: { marginTop: 4, color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
    emptyCopy: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  });
}