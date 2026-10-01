import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton, CustomerScreen, Field, Notice, SectionTitle } from '@/components/customer-ui';
import { FeatureCard, formatMoney } from '@/components/feature-ui';
import { apiRequest, getAuthState, type UserProfile } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type TradeIn = { id: number; description: string; estimated_price: number | string; contact_phone: string; status: string; created_at: string; updated_at: string };

export default function TradeInScreen() {
  const { colors } = useAppTheme();
  const [items, setItems] = useState<TradeIn[]>([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const auth = await getAuthState();
      if (!auth?.token) { router.replace('/login'); return; }
      const [list, profile] = await Promise.all([
        apiRequest<TradeIn[] | { results?: TradeIn[] }>('/payments/tradein/'),
        apiRequest<UserProfile>('/users/me/'),
      ]);
      setItems(Array.isArray(list) ? list : list.results || []);
      setPhone(profile.phone || '');
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load trade-ins.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    setError(''); setMessage('');
    if (!description.trim() || !phone.trim() || !Number.isFinite(Number(price)) || Number(price) <= 0) {
      setError('Enter an item description, a valid estimated price, and a contact phone number.');
      return;
    }
    setSaving(true);
    try {
      const result = await apiRequest<TradeIn>('/payments/tradein/', { method: 'POST', body: JSON.stringify({ description: description.trim(), estimated_price: Number(price), contact_phone: phone.trim() }) });
      setItems((current) => [result, ...current]);
      setDescription(''); setPrice('');
      setMessage('Trade-in submitted. Our team will contact you after reviewing the item.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit trade-in.');
    } finally { setSaving(false); }
  };

  return (
    <CustomerScreen title="Trade in an item" subtitle="Submit an appliance or equipment item for review and track its status. Approved items can receive credit toward Wild Wash services.">
      <FeatureCard>
        <SectionTitle>Submit a trade-in</SectionTitle>
        <Field label="Item description" value={description} onChangeText={setDescription} placeholder="Brand, model, condition, and any defects" multiline />
        <Field label="Estimated price (KES)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="e.g. 5000" />
        <Field label="Contact phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0712345678" />
        {error ? <Notice error>{error}</Notice> : null}
        {message ? <Notice>{message}</Notice> : null}
        <ActionButton title="Submit trade-in" onPress={submit} loading={saving} />
      </FeatureCard>
      <SectionTitle>Your submissions</SectionTitle>
      {loading ? <Notice>Loading your trade-ins…</Notice> : items.length === 0 ? <Notice>You have not submitted any trade-ins yet.</Notice> : items.map((item) => (
        <FeatureCard key={item.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '800' }}>Trade-in #{item.id}</Text>
            <Text style={{ color: item.status.toLowerCase() === 'approved' ? '#15803D' : item.status.toLowerCase() === 'rejected' ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' }}>{item.status}</Text>
          </View>
          <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>{item.description}</Text>
          <Text style={{ marginTop: 10, color: colors.text, fontWeight: '800' }}>Estimated: {formatMoney(item.estimated_price)}</Text>
          <Text style={{ marginTop: 5, color: colors.muted, fontSize: 11 }}>Submitted {new Date(item.created_at).toLocaleDateString('en-KE')}</Text>
        </FeatureCard>
      ))}
      <ActionButton title="Refresh list" secondary loading={loading} onPress={() => void load()} />
    </CustomerScreen>
  );
}
