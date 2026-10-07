import { useCallback, useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Notice, PaymentProgress, SectionTitle, type PaymentSummary } from '@/components/customer-ui';
import { apiRequest, getAuthState } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type Order = { id: number; code: string; status: string; created_at?: string; price?: number | string; actual_price?: number | string | null; is_paid?: boolean; service_name?: string; payment_summary?: PaymentSummary };
type OrderList = Order[] | { results?: Order[] };
const price = (value?: string | number | null) => value == null ? 'Not set' : `KSh ${Number(value).toLocaleString('en-KE')}`;

export default function OrdersScreen() {
  const { colors } = useAppTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<OrderList>('/orders/');
      setOrders(Array.isArray(result) ? result : result.results || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    getAuthState().then((auth) => { if (!auth?.token) router.replace('/login'); else void load(); });
  }, [load]);

  return (
    <CustomerScreen title="Your orders" subtitle="Track your orders and pay in full or in parts while staff confirms the final price.">
      <Link href="/book" asChild><Pressable style={{ marginBottom: 14 }}><Text style={{ color: colors.primary, fontWeight: '800' }}>＋  Book a pickup</Text></Pressable></Link>
      <ActionButton title="Refresh orders" secondary onPress={() => void load()} loading={loading} />
      {error ? <Notice error>{error}</Notice> : null}
      {!loading && !error && orders.length === 0 ? <Notice>No orders yet. Book a pickup to get started.</Notice> : null}
      {orders.map((order) => (
        <View key={order.code || order.id} style={{ marginTop: 12, padding: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900' }}>{order.code}</Text>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>{order.status}</Text>
          </View>
          <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 12 }}>{order.service_name || 'Wild Wash pickup'}{order.created_at ? ` · ${new Date(order.created_at).toLocaleDateString()}` : ''}</Text>
          <SectionTitle>{order.payment_summary?.price_finalized ? 'Final price' : 'Estimated price'}</SectionTitle>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{price(order.payment_summary?.final_total ?? order.actual_price ?? order.price)}</Text>
          <Text style={{ marginTop: 5, color: order.is_paid ? '#15803D' : colors.muted, fontSize: 12 }}>
            {order.is_paid
              ? 'Paid'
              : order.payment_summary?.payable_amount === 0 && !order.payment_summary.price_finalized
                ? 'Estimate covered; final price pending'
                : (order.payment_summary?.paid_amount ?? 0) > 0
                  ? 'Partially paid'
                  : 'Awaiting payment'}
          </Text>
          {order.payment_summary ? <PaymentProgress summary={order.payment_summary} /> : null}
          <ActionButton title="View details" secondary onPress={() => router.push(`/orders/${encodeURIComponent(order.code)}` as never)} />
          <ActionButton title="Payment status" secondary onPress={() => router.push(`/orders/${encodeURIComponent(order.code)}/payment-status` as never)} />
          {!order.is_paid && (order.payment_summary?.payable_amount ?? 0) > 0 ? <ActionButton title="Pay now" onPress={() => router.push({ pathname: '/checkout', params: { order_id: order.code } })} /> : null}
        </View>
      ))}
    </CustomerScreen>
  );
}