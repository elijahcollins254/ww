import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton, CustomerScreen, Notice, SectionTitle } from '@/components/customer-ui';
import { FeatureCard, formatMoney } from '@/components/feature-ui';
import { apiRequest, getAuthState } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type Loan = { id: string; loan_type: string; loan_amount: string | number; duration_days: number; purpose: string; status: string; total_interest: string | number; total_repayment: string | number; amount_repaid: string | number; order_code?: string; collateral_items?: Array<{ id: string; collateral_type: string; description: string; estimated_value: string | number }>; guarantors?: Array<{ id: string; name: string; phone_number: string; email: string; relationship: string }>; repayments?: Array<{ id: string; amount: string | number; status: string; created_at: string }>; created_at: string; due_date?: string };
const statusText: Record<string, string> = { pending: 'Awaiting review', approved: 'Approved', active: 'Active loan', repaid: 'Fully repaid', rejected: 'Rejected', defaulted: 'Defaulted', cancelled: 'Cancelled' };

export default function LoansScreen() {
  const { colors } = useAppTheme();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const auth = await getAuthState();
      if (!auth?.token) { router.replace('/login'); return; }
      const response = await apiRequest<Loan[] | { results?: Loan[] }>('/loans/loans/');
      setLoans(Array.isArray(response) ? response : response.results || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load loan applications.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <CustomerScreen title="My loan applications" subtitle="Follow application status, loan terms, collateral, and repayments.">
      <ActionButton title="New loan application" onPress={() => router.push('/borrow')} />
      {error ? <Notice error>{error}</Notice> : null}
      {loading ? <Notice>Loading your applications…</Notice> : loans.length === 0 ? <Notice>You have no loan applications yet.</Notice> : loans.map((loan) => {
        const open = expanded === loan.id;
        const remaining = Math.max(0, Number(loan.total_repayment || 0) - Number(loan.amount_repaid || 0));
        return (
          <FeatureCard key={loan.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>{loan.loan_type === 'order_collateral' ? 'Order loan' : 'Asset loan'}</Text>
                <Text style={{ marginTop: 4, color: colors.muted, fontSize: 12 }}>{formatMoney(loan.loan_amount)} · {loan.duration_days} days</Text>
              </View>
              <Text style={{ maxWidth: 130, color: loan.status === 'active' || loan.status === 'repaid' ? '#15803D' : colors.primary, fontSize: 12, fontWeight: '800', textAlign: 'right' }}>{statusText[loan.status] || loan.status}</Text>
            </View>
            <View style={{ marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <View><Text style={{ color: colors.muted, fontSize: 11 }}>Total repayment</Text><Text style={{ marginTop: 3, color: colors.text, fontWeight: '800' }}>{formatMoney(loan.total_repayment)}</Text></View>
              <View><Text style={{ color: colors.muted, fontSize: 11 }}>Remaining</Text><Text style={{ marginTop: 3, color: colors.primary, fontWeight: '800' }}>{formatMoney(remaining)}</Text></View>
              {loan.due_date ? <View><Text style={{ color: colors.muted, fontSize: 11 }}>Due</Text><Text style={{ marginTop: 3, color: colors.text, fontWeight: '700' }}>{new Date(loan.due_date).toLocaleDateString('en-KE')}</Text></View> : null}
            </View>
            <Pressable onPress={() => setExpanded(open ? null : loan.id)} style={{ marginTop: 13, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}><Text style={{ color: colors.text, fontWeight: '800' }}>{open ? 'Hide details' : 'View details'}</Text></Pressable>
            {open ? <View style={{ marginTop: 14, gap: 9 }}>
              <SectionTitle>Application details</SectionTitle>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>Purpose: {loan.purpose}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Interest: {formatMoney(loan.total_interest)} · Submitted {new Date(loan.created_at).toLocaleDateString('en-KE')}</Text>
              {loan.order_code ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Order collateral: {loan.order_code}</Text> : null}
              {loan.collateral_items?.map((item) => <Text key={item.id} style={{ color: colors.textSecondary, fontSize: 12 }}>{item.collateral_type}: {item.description} · {formatMoney(item.estimated_value)}</Text>)}
              {loan.guarantors?.length ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Guarantors: {loan.guarantors.map((person) => `${person.name} (${person.phone_number})`).join(', ')}</Text> : null}
              {loan.repayments?.length ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Repayments: {loan.repayments.map((payment) => `${formatMoney(payment.amount)} — ${payment.status}`).join('; ')}</Text> : null}
            </View> : null}
          </FeatureCard>
        );
      })}
      <ActionButton title="Refresh applications" secondary loading={loading} onPress={() => void load()} />
      <ActionButton title="Read loan terms" secondary onPress={() => router.push('/terms')} />
    </CustomerScreen>
  );
}
