import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Field, Notice, SectionTitle } from '@/components/customer-ui';
import { apiRequest, getAuthState } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type BNPLStatus = { is_enrolled: boolean; is_active?: boolean; credit_limit?: number; current_balance?: number; phone_number?: string };
type PaymentCheck = { has_pending_payment?: boolean; payment_status?: string; message?: string; current_balance?: number; credit_limit?: number; payment_amount?: number };
const cash = (amount = 0) => `KSh ${Number(amount).toLocaleString('en-KE')}`;

export default function BNPLScreen() {
  const { colors } = useAppTheme();
  const [status, setStatus] = useState<BNPLStatus | null>(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const profile = await apiRequest<{ phone?: string }>('/users/me/');
      setPhone(profile.phone || '');
      setStatus(await apiRequest<BNPLStatus>('/payments/bnpl/status/'));
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load BNPL.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    getAuthState().then((auth) => { if (!auth?.token) router.replace('/login'); else void refresh(); });
  }, [refresh]);
  const post = async (path: string, body: Record<string, unknown> = {}) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await apiRequest<{ message?: string }>(path, { method: 'POST', body: JSON.stringify(body) });
      if (path.includes('/pay_balance/')) {
        setPaymentPending(true);
        setMessage(response.message || 'M-PESA prompt sent. Enter your PIN to complete payment.');
        setLoading(false);
        for (let attempt = 0; attempt < 30; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
          const payment = await apiRequest<PaymentCheck>('/payments/bnpl/check_pending_payment/');
          if (payment.payment_status === 'success') {
            setStatus((current) => current ? { ...current, current_balance: payment.current_balance ?? 0, credit_limit: payment.credit_limit ?? current.credit_limit } : current);
            setMessage(`Payment confirmed. New balance: ${cash(payment.current_balance || 0)}.`);
            setPaymentPending(false);
            return;
          }
          if (payment.payment_status === 'failed') {
            throw new Error(payment.message || 'Payment failed. Please try again.');
          }
          if (!payment.has_pending_payment && !payment.payment_status) break;
        }
        setPaymentPending(false);
        setMessage('Payment is not confirmed yet. Refresh the account to check the latest balance.');
        await refresh();
      } else {
        setMessage(response.message || 'Request completed.');
        await refresh();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Request failed.');
      setPaymentPending(false);
    }
    setLoading(false);
  };

  return (
    <CustomerScreen title="Pay over time" subtitle="Manage your BNPL account, available credit and repayments.">
      {status ? (
        <View style={{ marginTop: 14, padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 5 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>AVAILABLE CREDIT</Text>
          <Text style={{ marginTop: 4, color: colors.text, fontSize: 27, fontWeight: '900' }}>{cash((status.credit_limit || 0) - (status.current_balance || 0))}</Text>
          <Text style={{ marginTop: 14, color: colors.textSecondary, fontSize: 12 }}>CURRENT BALANCE</Text>
          <Text style={{ marginTop: 4, color: colors.text, fontSize: 18, fontWeight: '800' }}>{cash(status.current_balance)}</Text>
          <Text style={{ marginTop: 10, color: colors.muted, fontSize: 12 }}>{status.is_enrolled ? (status.is_active ? 'Account active' : 'Account inactive') : 'Not enrolled'}</Text>
        </View>
      ) : null}
      {error ? <Notice error>{error}</Notice> : null}
      {message ? <Notice>{message}</Notice> : null}
      {status?.is_enrolled ? (
        <>
          <SectionTitle>Repay balance</SectionTitle>
          <Field label="Phone receiving M-Pesa prompt" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Amount (leave blank to pay full balance)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={cash(status.current_balance)} />
          <ActionButton title={paymentPending ? 'Waiting for M-PESA confirmation…' : 'Pay with M-Pesa'} loading={loading || paymentPending} onPress={() => post('/payments/bnpl/pay_balance/', { phone_number: phone, ...(amount ? { amount: Number(amount) } : {}) })} />
          <ActionButton title="Leave BNPL" secondary loading={loading} disabled={Number(status.current_balance || 0) > 0} onPress={() => post('/payments/bnpl/opt_out/')} />
          {Number(status.current_balance || 0) > 0 ? <Text style={{ marginTop: 8, color: colors.muted, fontSize: 11, textAlign: 'center' }}>Clear the balance before opting out.</Text> : null}
        </>
      ) : (
        <>
          <SectionTitle>Enrollment</SectionTitle>
          <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <ActionButton title="Enroll in BNPL" loading={loading} onPress={() => post('/payments/bnpl/opt_in/', { phone_number: phone })} />
        </>
      )}
      <ActionButton title="Refresh account" secondary loading={loading} onPress={() => { setLoading(true); void refresh(); }} />
    </CustomerScreen>
  );
}