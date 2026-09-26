import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Notice, SectionTitle } from '@/components/customer-ui';
import { apiRequest } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type PaymentStatus = { status: string; message?: string; checkout_request_id?: string; order_id?: string; amount?: number; delivery_requested?: boolean };

export default function PaymentStatusScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { colors } = useAppTheme();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [requestingDelivery, setRequestingDelivery] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const data = await apiRequest<PaymentStatus>(`/orders/${encodeURIComponent(code)}/payment-status/`);
      setStatus(data);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to fetch payment status.');
    } finally {
      setLoading(false);
    }
  }, [code]);
  useEffect(() => {
    const timer = setTimeout(() => { void refresh(); }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    if (attempt >= 12 || (status && ['success', 'completed', 'failed'].includes(status.status))) return;
    const timer = setTimeout(() => { setAttempt((current) => current + 1); void refresh(); }, 5000);
    return () => clearTimeout(timer);
  }, [attempt, refresh, status]);

  const requestDelivery = async () => {
    setRequestingDelivery(true);
    setMessage('');
    setError('');
    try {
      await apiRequest(`/orders/${encodeURIComponent(code)}/request-delivery/`, { method: 'POST', body: JSON.stringify({}) });
      setMessage('Delivery request sent to your rider.');
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to request delivery.');
    } finally {
      setRequestingDelivery(false);
    }
  };
  const complete = status?.status === 'success' || status?.status === 'completed';
  const failed = status?.status === 'failed';

  return (
    <CustomerScreen title={complete ? 'Payment successful' : failed ? 'Payment failed' : 'Payment status'} subtitle={`Order ${code}`}>
      {error ? <Notice error>{error}</Notice> : null}
      {status ? (
        <>
          <View style={{ padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 5 }}>
            <Text style={{ color: complete ? '#15803D' : failed ? '#B91C1C' : colors.primary, fontSize: 20, fontWeight: '900', textTransform: 'capitalize' }}>{status.status}</Text>
            {status.message ? <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13 }}>{status.message}</Text> : null}
            {status.amount != null ? <Text style={{ marginTop: 16, color: colors.text, fontSize: 16, fontWeight: '800' }}>KSh {Number(status.amount).toLocaleString('en-KE')}</Text> : null}
            {status.checkout_request_id ? <Text style={{ marginTop: 7, color: colors.muted, fontSize: 11 }}>Reference: {status.checkout_request_id}</Text> : null}
          </View>
          {!complete && !failed && attempt < 12 ? <Notice>Check your phone for the M-Pesa prompt and enter your PIN. Status refreshes automatically.</Notice> : null}
          {complete ? <><SectionTitle>Delivery</SectionTitle><ActionButton title={status.delivery_requested ? 'Rider notified' : 'Request delivery'} onPress={requestDelivery} loading={requestingDelivery} disabled={status.delivery_requested} /></> : null}
        </>
      ) : loading ? <Notice>Checking payment status…</Notice> : null}
      {message ? <Notice>{message}</Notice> : null}
      <ActionButton title="Refresh status" secondary onPress={() => { setLoading(true); void refresh(); }} loading={loading} />
      {failed || attempt >= 12 ? <ActionButton title="Try payment again" onPress={() => router.push({ pathname: '/checkout', params: { order_id: code, amount: status?.amount ? String(status.amount) : undefined } })} /> : null}
      <ActionButton title="Back to orders" secondary onPress={() => router.replace('/orders')} />
    </CustomerScreen>
  );
}