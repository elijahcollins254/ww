import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Notice, SectionTitle } from '@/components/customer-ui';
import { apiRequest } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type OrderDetail = {
  id?: number;
  code?: string;
  status?: string;
  service_name?: string;
  created_at?: string;
  price?: number | string | null;
  actual_price?: number | string | null;
  is_paid?: boolean;
  payment_method?: string | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  quantity?: number | null;
  package?: string | null;
  notes?: string | null;
};

const money = (value?: string | number | null) => {
  if (value == null || value === '') return 'Not set';
  const amount = Number(value);
  return Number.isFinite(amount) ? `KSh ${amount.toLocaleString('en-KE')}` : `KSh ${String(value)}`;
};

export default function OrderDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrder = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<OrderDetail | { results?: OrderDetail[] }>(`/orders/?code=${encodeURIComponent(code)}`);
      const list = Array.isArray(result) ? result : result.results ?? [];
      const match = list.find((item) => item.code === code || item.id === Number(code));
      if (!match) {
        throw new Error('Order not found.');
      }
      setOrder(match);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load order details.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  if (loading) {
    return (
      <CustomerScreen title="Order details" subtitle="Loading order information…">
        <Notice>Checking the latest order details…</Notice>
      </CustomerScreen>
    );
  }

  if (error || !order) {
    return (
      <CustomerScreen title="Order details" subtitle="We couldn't find this order.">
        <Notice error>{error || 'Order not found.'}</Notice>
        <ActionButton title="Back to orders" secondary onPress={() => router.replace('/orders')} />
      </CustomerScreen>
    );
  }

  const finalPrice = order.actual_price ?? order.price;

  return (
    <CustomerScreen title={order.code || 'Order details'} subtitle={order.service_name || 'Wild Wash service'}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Status</Text>
          <Text style={[styles.status, { color: order.is_paid ? '#15803D' : colors.primary }]}>{order.status || 'Received'}</Text>
          <Text style={styles.meta}>Placed {order.created_at ? new Date(order.created_at).toLocaleString() : 'recently'}</Text>
        </View>

        <View style={styles.card}>
          <SectionTitle>Order summary</SectionTitle>
          <View style={styles.row}><Text style={styles.label}>Service</Text><Text style={styles.value}>{order.service_name || 'Wild Wash service'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Package</Text><Text style={styles.value}>{order.package || 'Standard'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Items</Text><Text style={styles.value}>{order.quantity ?? 1}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Final price</Text><Text style={styles.value}>{money(finalPrice)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Payment</Text><Text style={styles.value}>{order.is_paid ? 'Paid' : 'Awaiting payment'}</Text></View>
        </View>

        <View style={styles.card}>
          <SectionTitle>Pickup details</SectionTitle>
          <Text style={styles.value}>{order.pickup_address || 'Pickup address not set yet.'}</Text>
          <Text style={[styles.meta, { marginTop: 14 }]}>Drop-off</Text>
          <Text style={styles.value}>{order.dropoff_address || 'Drop-off address will be confirmed after pickup.'}</Text>
        </View>

        {order.notes ? (
          <View style={styles.card}>
            <SectionTitle>Notes</SectionTitle>
            <Text style={styles.value}>{order.notes}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {!order.is_paid ? (
            <ActionButton title="Proceed to checkout" onPress={() => router.push({ pathname: '/checkout', params: { order_id: String(order.code), amount: String(finalPrice ?? '') } })} />
          ) : null}
          <ActionButton title="Payment status" secondary onPress={() => router.push(`/orders/${encodeURIComponent(String(order.code))}/payment-status` as never)} />
          <Link href="/orders" asChild>
            <Pressable style={styles.linkButton}>
              <Text style={styles.linkButtonText}>Back to orders</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </CustomerScreen>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    content: { paddingBottom: 40 },
    card: {
      marginTop: 14,
      padding: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
    },
    cardLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
    status: { marginTop: 6, fontSize: 22, fontWeight: '900' },
    meta: { marginTop: 8, color: colors.muted, fontSize: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12 },
    label: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', flexShrink: 1 },
    value: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
    actions: { marginTop: 16, gap: 6 },
    linkButton: {
      minHeight: 48,
      marginTop: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    linkButtonText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  });
}
