import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton, CustomerScreen, Field, Notice, SectionTitle } from '@/components/customer-ui';
import { FeatureCard, formatMoney } from '@/components/feature-ui';
import { apiRequest, getAuthState } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type BorrowOrder = { id: number; code: string; created_at?: string; status: string; price: string | number; actual_price?: string | number; total_price?: string | number; service_name?: string };
const relationships = ['friend', 'family', 'employer', 'colleague', 'business_partner', 'other'];
const collateralTypes = ['property', 'vehicle', 'equipment', 'jewelry', 'electronics', 'other'];

export default function BorrowScreen() {
  const { colors } = useAppTheme();
  const [mode, setMode] = useState<'order_collateral' | 'collateral_only'>('order_collateral');
  const [orders, setOrders] = useState<BorrowOrder[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [assetType, setAssetType] = useState('property');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [purpose, setPurpose] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorEmail, setGuarantorEmail] = useState('');
  const [relationship, setRelationship] = useState('friend');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    getAuthState().then((auth) => {
      if (!auth?.token) { router.replace('/login'); return; }
      setOrdersLoading(true);
      apiRequest<BorrowOrder[] | { results?: BorrowOrder[] }>('/orders/?page_size=100')
        .then((response) => {
          if (!active) return;
          const list = Array.isArray(response) ? response : response.results || [];
          setOrders(list.filter((order) => !['delivered', 'cancelled'].includes(order.status?.toLowerCase())));
        })
        .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load your orders.'); })
        .finally(() => { if (active) setOrdersLoading(false); });
    });
    return () => { active = false; };
  }, []);

  const selectedOrder = orders.find((order) => order.id === orderId);
  const orderValue = selectedOrder ? Number(selectedOrder.total_price || selectedOrder.actual_price || selectedOrder.price || 0) : 0;
  const collateralValue = mode === 'order_collateral' ? orderValue : Number(assetValue || 0);
  const maxAmount = collateralValue * 0.6;
  const projectedInterest = Number(loanAmount || 0) * 0.02 * Number(duration || 0);
  const projectedRepayment = Number(loanAmount || 0) + projectedInterest;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guarantorEmail.trim());
  const canSubmit = useMemo(() => Boolean(termsAccepted && Number(loanAmount) > 0 && Number(loanAmount) <= maxAmount && Number(duration) > 0 && purpose.trim() && guarantorName.trim() && guarantorPhone.trim() && validEmail && (mode === 'order_collateral' ? selectedOrder : assetDescription.trim() && Number(assetValue) > 0)), [termsAccepted, loanAmount, maxAmount, duration, purpose, guarantorName, guarantorPhone, validEmail, mode, selectedOrder, assetDescription, assetValue]);

  const submit = async () => {
    setError(''); setSuccess('');
    if (!canSubmit) { setError('Complete all loan details, provide a valid guarantor, accept the terms, and stay within the 60% collateral limit.'); return; }
    setLoading(true);
    try {
      const payload = {
        loan_type: mode,
        loan_amount: Number(loanAmount),
        duration_days: Number(duration),
        purpose: purpose.trim(),
        ...(mode === 'order_collateral' ? { order_id: selectedOrder!.id } : { collateral_items: [{ type: assetType, description: assetDescription.trim(), estimated_value: Number(assetValue) }] }),
        guarantors: [{ name: guarantorName.trim(), phone_number: guarantorPhone.trim(), email: guarantorEmail.trim(), relationship }],
      };
      const result = await apiRequest<{ id?: string }>('/loans/request/', { method: 'POST', body: JSON.stringify(payload) });
      setSuccess(`Application ${result.id ? `#${result.id}` : ''} submitted for review.`);
      setTimeout(() => router.replace('/loans'), 1000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit your application.');
    } finally { setLoading(false); }
  };

  const chip = (value: string, selected: boolean, onPress: () => void) => <Pressable key={value} onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.surface, borderRadius: 20 }}><Text style={{ color: selected ? '#FFFFFF' : colors.text, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{value.replaceAll('_', ' ')}</Text></Pressable>;

  return (
    <CustomerScreen title="Get a loan" subtitle="Apply using an eligible Wild Wash order or other collateral. A guarantor is required for every application.">
      <SectionTitle>Choose collateral</SectionTitle>
      <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>{chip('order_collateral', mode === 'order_collateral', () => setMode('order_collateral'))}{chip('collateral_only', mode === 'collateral_only', () => setMode('collateral_only'))}</View>
      {mode === 'order_collateral' ? <>
        <SectionTitle>Select an order</SectionTitle>
        {ordersLoading ? <Notice>Loading your orders…</Notice> : orders.length === 0 ? <Notice>No eligible orders found. You can apply using other assets instead.</Notice> : orders.map((order) => {
          const value = Number(order.total_price || order.actual_price || order.price || 0);
          const active = orderId === order.id;
          return <Pressable key={order.id} onPress={() => setOrderId(order.id)} style={{ marginTop: 9, padding: 14, borderWidth: 1, borderColor: active ? colors.primary : colors.border, borderRadius: 10, backgroundColor: active ? colors.chip : colors.surface }}><Text style={{ color: colors.text, fontWeight: '800' }}>{order.service_name || `Order ${order.code}`}</Text><Text style={{ marginTop: 5, color: colors.muted, fontSize: 12 }}>{order.code} · {order.status}</Text><Text style={{ marginTop: 5, color: colors.primary, fontWeight: '800' }}>Order value {formatMoney(value)} · max loan {formatMoney(value * 0.6)}</Text></Pressable>;
        })}
      </> : <>
        <SectionTitle>Collateral asset</SectionTitle>
        <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{collateralTypes.map((type) => chip(type, assetType === type, () => setAssetType(type)))}</View>
        <Field label="Describe the asset" value={assetDescription} onChangeText={setAssetDescription} placeholder="Brand, model, location, condition, or identifying details" multiline />
        <Field label="Estimated value (KES)" value={assetValue} onChangeText={setAssetValue} keyboardType="decimal-pad" placeholder="Estimated market value" />
      </>}

      <SectionTitle>Loan details</SectionTitle>
      <Field label="Loan amount (KES)" value={loanAmount} onChangeText={setLoanAmount} keyboardType="decimal-pad" placeholder={`Maximum ${formatMoney(maxAmount)}`} />
      <Field label="Duration (days)" value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="30" />
      <Field label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="How will you use the loan?" multiline />
      <FeatureCard><Text style={{ color: colors.text, fontWeight: '800' }}>Estimate</Text><Text style={{ marginTop: 8, color: colors.textSecondary }}>Maximum eligible amount: {formatMoney(maxAmount)}</Text><Text style={{ marginTop: 5, color: colors.textSecondary }}>At 2% daily simple interest, estimated repayment: {formatMoney(projectedRepayment)} ({formatMoney(projectedInterest)} interest).</Text></FeatureCard>

      <SectionTitle>Guarantor</SectionTitle>
      <Field label="Full name" value={guarantorName} onChangeText={setGuarantorName} placeholder="Guarantor name" />
      <Field label="Phone number" value={guarantorPhone} onChangeText={setGuarantorPhone} keyboardType="phone-pad" placeholder="0712345678" />
      <Field label="Email address" value={guarantorEmail} onChangeText={setGuarantorEmail} keyboardType="email-address" autoCapitalize="none" placeholder="name@example.com" />
      <Text style={{ marginTop: 14, color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Relationship</Text>
      <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{relationships.map((value) => chip(value, relationship === value, () => setRelationship(value)))}</View>
      <Pressable onPress={() => setTermsAccepted((current) => !current)} style={{ marginTop: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}><View style={{ width: 22, height: 22, borderWidth: 1, borderColor: termsAccepted ? colors.primary : colors.border, borderRadius: 5, backgroundColor: termsAccepted ? colors.primary : colors.surface, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{termsAccepted ? '✓' : ''}</Text></View><Text style={{ flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>I have reviewed and accept the <Text onPress={() => router.push('/terms')} style={{ color: colors.primary, fontWeight: '800' }}>loan terms</Text>.</Text></Pressable>
      {error ? <Notice error>{error}</Notice> : null}{success ? <Notice>{success}</Notice> : null}
      <ActionButton title="Submit loan application" onPress={submit} loading={loading} disabled={!canSubmit} />
      <ActionButton title="View my applications" secondary onPress={() => router.push('/loans')} />
    </CustomerScreen>
  );
}
