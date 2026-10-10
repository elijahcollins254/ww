import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Field, Notice, PaymentProgress, SectionTitle, type PaymentSummary } from '@/components/customer-ui';
import { apiRequest } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type Method = 'mpesa' | 'tradein' | 'gift';
const methods: { key: Method; label: string }[] = [
  { key: 'mpesa', label: 'M-Pesa' }, { key: 'tradein', label: 'Trade-in' }, { key: 'gift', label: 'Gift' },
];

type OrderSummaryResult = { code: string; payment_summary?: PaymentSummary };
type OrderSummaryResponse = OrderSummaryResult[] | { results?: OrderSummaryResult[] };

async function getOrderPaymentSummary(code: string) {
  const result = await apiRequest<OrderSummaryResponse>(`/orders/?code=${encodeURIComponent(code)}`);
  const orders = Array.isArray(result) ? result : result.results ?? [];
  const order = orders.find((item) => item.code === code);
  if (!order?.payment_summary) throw new Error('Could not load this order payment balance.');
  return { code: order.code, summary: order.payment_summary };
}

export default function CheckoutScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ order_id?: string }>();
  const [orderId, setOrderId] = useState(params.order_id || '');
  const [amount, setAmount] = useState('');
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [summaryOrderCode, setSummaryOrderCode] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<Method>('mpesa');
  const [tradeDescription, setTradeDescription] = useState('');
  const [tradePrice, setTradePrice] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const loadOrderBalance = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setSummaryLoading(true);
    setError('');
    try {
      const result = await getOrderPaymentSummary(code.trim());
      setOrderId(result.code);
      setSummaryOrderCode(result.code);
      setPaymentSummary(result.summary);
      setAmount(String(Math.floor(result.summary.payable_amount)));
    } catch (requestError) {
      setPaymentSummary(null);
      setSummaryOrderCode('');
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the order balance.');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    apiRequest<{ phone?: string }>('/users/me/').then((user) => setPhone(user.phone || '')).catch(() => undefined);
    if (!params.order_id) return;

    let active = true;
    getOrderPaymentSummary(params.order_id)
      .then((result) => {
        if (!active) return;
        setOrderId(result.code);
        setSummaryOrderCode(result.code);
        setPaymentSummary(result.summary);
        setAmount(String(Math.floor(result.summary.payable_amount)));
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : 'Unable to load the order balance.');
      });

    return () => { active = false; };
  }, [params.order_id]);

  const submit = async () => {
    setError('');
    setMessage('');
    const numericAmount = Number(amount);
    if (!orderId.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an order code and a payment amount greater than zero.');
      return;
    }
    if (!paymentSummary || summaryOrderCode !== orderId) {
      setError('Load the order balance before continuing.');
      return;
    }
    if (numericAmount > paymentSummary.payable_amount) {
      setError(`Payment cannot exceed the remaining payable amount of KSh ${paymentSummary.payable_amount.toLocaleString('en-KE')}.`);
      return;
    }
    if (method === 'mpesa' && !Number.isInteger(numericAmount)) {
      setError('M-Pesa payments must be in whole KES amounts.');
      return;
    }
    if (method !== 'gift' && phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      if (method === 'mpesa') {
        await apiRequest('/payments/mpesa/stk-push/', { method: 'POST', body: JSON.stringify({ amount: numericAmount, phone, order_id: orderId }) });
        router.replace(`/orders/${encodeURIComponent(orderId)}/payment-status` as never);
        return;
      }
      if (method === 'tradein') {
        if (!tradeDescription.trim() || !Number(tradePrice)) throw new Error('Describe the item and enter its estimated value.');
        await apiRequest('/payments/tradein/', { method: 'POST', body: JSON.stringify({ description: tradeDescription, estimated_price: Number(tradePrice), contact_phone: phone }) });
        setMessage('Trade-in request sent. Our team will contact you.');
        return;
      }
      setMessage('Gift payment selected. Please contact support to apply a gift payment.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to start payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerScreen title="Checkout" subtitle="Choose an amount to pay now. The final total may change when staff confirms the price.">
      <Field label="Order code" value={orderId} onChangeText={setOrderId} editable={!params.order_id} placeholder="WW-00000" />
      {!params.order_id || summaryOrderCode !== orderId ? (
        <ActionButton title={summaryLoading ? 'Loading balance' : 'Load order balance'} secondary onPress={() => void loadOrderBalance(orderId)} loading={summaryLoading} disabled={!orderId.trim()} />
      ) : null}
      <Field label="Pay now (KES)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" editable={!summaryLoading && Boolean(paymentSummary)} />
      {paymentSummary ? <PaymentProgress summary={paymentSummary} /> : null}
      <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0712345678" />
      <SectionTitle>Payment method</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
        {methods.map(({ key, label }) => <Pressable key={key} accessibilityRole="radio" accessibilityState={{ selected: method === key }} onPress={() => setMethod(key)} style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: method === key ? colors.primary : colors.surface, borderWidth: 1, borderColor: method === key ? colors.primary : colors.border, borderRadius: 4 }}><Text style={{ color: method === key ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '800' }}>{label}</Text></Pressable>)}
      </View>
      {method === 'tradein' ? <><Field label="Trade-in item description" value={tradeDescription} onChangeText={setTradeDescription} multiline placeholder="Describe item condition and details" /><Field label="Estimated value (KES)" value={tradePrice} onChangeText={setTradePrice} keyboardType="decimal-pad" /></> : null}
      {error ? <Notice error>{error}</Notice> : null}
      {message ? <Notice>{message}</Notice> : null}
      <ActionButton title={method === 'mpesa' ? 'Send M-Pesa prompt' : method === 'tradein' ? 'Submit trade-in' : 'Continue with gift'} onPress={submit} loading={loading} disabled={!paymentSummary || summaryOrderCode !== orderId || paymentSummary.payable_amount <= 0} />
      <ActionButton title="Back to orders" secondary onPress={() => router.push('/orders')} />
    </CustomerScreen>
  );
}