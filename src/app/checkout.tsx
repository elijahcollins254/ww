import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Field, Notice, SectionTitle } from '@/components/customer-ui';
import { apiRequest } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type Method = 'mpesa' | 'bnpl' | 'tradein' | 'gift';
const methods: { key: Method; label: string }[] = [
  { key: 'mpesa', label: 'M-Pesa' }, { key: 'bnpl', label: 'BNPL' }, { key: 'tradein', label: 'Trade-in' }, { key: 'gift', label: 'Gift' },
];

export default function CheckoutScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ order_id?: string; amount?: string }>();
  const [orderId, setOrderId] = useState(params.order_id || '');
  const [amount, setAmount] = useState(params.amount || '');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<Method>('mpesa');
  const [tradeDescription, setTradeDescription] = useState('');
  const [tradePrice, setTradePrice] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    apiRequest<{ phone?: string }>('/users/me/').then((user) => setPhone(user.phone || '')).catch(() => undefined);
  }, []);

  const submit = async () => {
    setError('');
    setMessage('');
    const numericAmount = Number(amount);
    if (!orderId.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('An order ID and final price are required.');
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
      if (method === 'bnpl') {
        const status = await apiRequest<{ is_enrolled: boolean; is_active?: boolean; credit_limit: number; current_balance: number }>('/payments/bnpl/status/');
        if (!status.is_enrolled || status.is_active === false) throw new Error('Enroll in BNPL and activate your account before using it.');
        const available = status.credit_limit - status.current_balance;
        if (numericAmount > available) throw new Error(`The order is above your available credit of KSh ${available.toLocaleString('en-KE')}.`);
        await apiRequest('/payments/bnpl/process/', { method: 'POST', body: JSON.stringify({ order_id: orderId, amount: numericAmount }) });
        setMessage('BNPL payment applied to your order.');
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
    <CustomerScreen title="Checkout" subtitle="Confirm your order amount and choose how you want to pay.">
      <Field label="Order code" value={orderId} onChangeText={setOrderId} editable={!params.order_id} placeholder="WW-00000" />
      <Field label="Amount (KES)" value={amount} onChangeText={setAmount} editable={!params.amount} keyboardType="decimal-pad" />
      <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0712345678" />
      <SectionTitle>Payment method</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
        {methods.map(({ key, label }) => <Pressable key={key} accessibilityRole="radio" accessibilityState={{ selected: method === key }} onPress={() => setMethod(key)} style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: method === key ? colors.primary : colors.surface, borderWidth: 1, borderColor: method === key ? colors.primary : colors.border, borderRadius: 4 }}><Text style={{ color: method === key ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '800' }}>{label}</Text></Pressable>)}
      </View>
      {method === 'tradein' ? <><Field label="Trade-in item description" value={tradeDescription} onChangeText={setTradeDescription} multiline placeholder="Describe item condition and details" /><Field label="Estimated value (KES)" value={tradePrice} onChangeText={setTradePrice} keyboardType="decimal-pad" /></> : null}
      {method === 'bnpl' ? <Notice>BNPL requires an active account and enough available credit. Manage enrollment in your profile.</Notice> : null}
      {error ? <Notice error>{error}</Notice> : null}
      {message ? <Notice>{message}</Notice> : null}
      <ActionButton title={method === 'mpesa' ? 'Send M-Pesa prompt' : method === 'bnpl' ? 'Pay with BNPL' : method === 'tradein' ? 'Submit trade-in' : 'Continue with gift'} onPress={submit} loading={loading} />
      <ActionButton title="Back to orders" secondary onPress={() => router.push('/orders')} />
    </CustomerScreen>
  );
}