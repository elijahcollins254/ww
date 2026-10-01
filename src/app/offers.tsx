import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton, CustomerScreen, Notice } from '@/components/customer-ui';
import { FeatureCard, formatMoney } from '@/components/feature-ui';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest, getAuthState } from '@/lib/api';

type Offer = { id: number; title: string; description: string; discount_percent: number; discount_amount: number; code: string; valid_until: string | null; max_uses: number | null; current_uses: number; is_claimed: boolean };
type OfferSubscription = { is_active?: boolean; is_subscribed?: boolean };

export default function OffersScreen() {
  const { colors } = useAppTheme();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const auth = await getAuthState();
      setAuthenticated(Boolean(auth?.token));
      const [offersResponse, subscriptionResponse] = await Promise.all([
        apiRequest<Offer[] | { results?: Offer[] }>('/offers'),
        auth?.token ? apiRequest<OfferSubscription>('/offers/subscriptions/my_subscription') : Promise.resolve(null),
      ]);
      setOffers(Array.isArray(offersResponse) ? offersResponse : offersResponse.results || []);
      setSubscribed(Boolean(subscriptionResponse?.is_active ?? subscriptionResponse?.is_subscribed));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load offers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return offers.filter((offer) => !term || `${offer.title} ${offer.description} ${offer.code} ${offer.discount_percent}`.toLowerCase().includes(term));
  }, [offers, query]);

  const claim = async (id: number) => {
    if (!authenticated) { router.push('/login'); return; }
    setBusyId(id); setError(''); setMessage('');
    try {
      await apiRequest(`/offers/${id}/claim`, { method: 'POST' });
      setOffers((current) => current.map((offer) => offer.id === id ? { ...offer, is_claimed: true, current_uses: offer.current_uses + 1 } : offer));
      setMessage('Offer added to your account.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to claim offer.');
    } finally { setBusyId(null); }
  };

  const toggleSubscription = async () => {
    if (!authenticated) { router.push('/login'); return; }
    setBusyId(-1); setError(''); setMessage('');
    try {
      if (subscribed) await apiRequest('/offers/subscriptions/unsubscribe', { method: 'POST' });
      else await apiRequest('/offers/subscriptions/my_subscription', { method: 'POST' });
      setSubscribed(!subscribed);
      setMessage(subscribed ? 'Offer SMS notifications disabled.' : 'You are subscribed to offer SMS notifications.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update notifications.');
    } finally { setBusyId(null); }
  };

  return (
    <CustomerScreen title="Offers" subtitle="Browse current deals, claim discounts, and get notified when new offers arrive.">
      <TextInput value={query} onChangeText={setQuery} placeholder="Search offers" placeholderTextColor={colors.muted} style={{ minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface, color: colors.text }} />
      {authenticated ? <ActionButton title={busyId === -1 ? 'Updating…' : subscribed ? 'Turn off offer SMS' : 'Subscribe to offer SMS'} secondary loading={busyId === -1} onPress={toggleSubscription} /> : <ActionButton title="Sign in for offers" secondary onPress={() => router.push('/login')} />}
      {error ? <Notice error>{error}</Notice> : null}
      {message ? <Notice>{message}</Notice> : null}
      {loading ? <Notice>Loading current offers…</Notice> : filtered.length === 0 ? <Notice>No matching offers are available.</Notice> : filtered.map((offer) => (
        <FeatureCard key={offer.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '900' }}>{offer.title}</Text>
              <Text style={{ marginTop: 7, color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>{offer.description}</Text>
              <Text style={{ marginTop: 9, color: colors.muted, fontSize: 12 }}>Code: {offer.code}</Text>
            </View>
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 14 }}>{offer.discount_percent > 0 ? `${offer.discount_percent}% OFF` : `${formatMoney(offer.discount_amount)} OFF`}</Text>
          </View>
          {offer.valid_until ? <Text style={{ marginTop: 9, color: colors.muted, fontSize: 11 }}>Expires {new Date(offer.valid_until).toLocaleDateString('en-KE')}</Text> : null}
          {offer.max_uses ? <Text style={{ marginTop: 4, color: colors.muted, fontSize: 11 }}>{Math.max(0, offer.max_uses - offer.current_uses)} remaining</Text> : null}
          {offer.is_claimed ? <Text style={{ marginTop: 14, color: '#15803D', fontWeight: '800' }}>Claimed ✓</Text> : <Pressable disabled={busyId === offer.id} onPress={() => void claim(offer.id)} style={{ marginTop: 14, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.primary, opacity: busyId === offer.id ? 0.6 : 1 }}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{busyId === offer.id ? 'Claiming…' : 'Claim offer'}</Text></Pressable>}
        </FeatureCard>
      ))}
      <ActionButton title="Refresh offers" secondary loading={loading} onPress={() => void load()} />
    </CustomerScreen>
  );
}
