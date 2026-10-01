import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Field, Notice, SectionTitle } from '@/components/customer-ui';
import { apiRequest, clearAuthState, getAuthState, type UserProfile } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type Location = { id: number; name: string; description?: string };
type Subscription = { id: number; frequency: 'weekly' | 'bi-weekly' | 'monthly'; active?: boolean; next_pickup_date?: string };
type ClaimedOffer = { id: number; claimed_at: string; is_used: boolean; offer: { title: string; description: string; discount_percent?: number; discount_amount?: number } };

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const [profile, setProfile] = useState<UserProfile>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [claimedOffers, setClaimedOffers] = useState<ClaimedOffer[]>([]);
  const [offerSubscribed, setOfferSubscribed] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let active = true;
    getAuthState().then(async (auth) => {
      if (!auth?.token) {
        router.replace('/login');
        return null;
      }
      const [data] = await Promise.all([
        apiRequest<UserProfile>('/users/me/'),
        apiRequest<Location[] | { results?: Location[] }>('/users/locations/').then((result) => setLocations(Array.isArray(result) ? result : result.results || [])).catch(() => setLocations([])),
        apiRequest<Subscription | null>('/user/me/subscription/').then(setSubscription).catch(() => setSubscription(null)),
        apiRequest<{ results?: ClaimedOffer[] } | ClaimedOffer[]>('/offers/user-offers').then((result) => setClaimedOffers(Array.isArray(result) ? result : result.results || [])).catch(() => setClaimedOffers([])),
        apiRequest<{ is_active?: boolean; is_subscribed?: boolean }>('/offers/subscriptions/my_subscription').then((result) => setOfferSubscribed(Boolean(result.is_active ?? result.is_subscribed))).catch(() => setOfferSubscribed(false)),
      ]);
      return data;
    }).then((data) => { if (active && data) setProfile(data); }).catch((requestError) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load profile.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = (key: keyof UserProfile, value: string | number | null) => setProfile((current) => ({ ...current, [key]: value }));
  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await apiRequest<UserProfile>('/users/me/', { method: 'PATCH', body: JSON.stringify(profile) });
      setProfile(result);
      setMessage('Profile saved.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const updateSubscription = async (frequency: Subscription['frequency'] | null) => {
    setSubscriptionBusy(true);
    setProfileError('');
    try {
      if (frequency) setSubscription(await apiRequest<Subscription>('/user/me/subscription/', { method: 'POST', body: JSON.stringify({ frequency }) }));
      else {
        await apiRequest('/user/me/subscription/', { method: 'DELETE' });
        setSubscription(null);
      }
    } catch (requestError) {
      setProfileError(requestError instanceof Error ? requestError.message : 'Unable to update pickup subscription.');
    } finally { setSubscriptionBusy(false); }
  };

  const toggleOfferSubscription = async () => {
    setSubscriptionBusy(true);
    setProfileError('');
    try {
      if (offerSubscribed) await apiRequest('/offers/subscriptions/unsubscribe', { method: 'POST' });
      else await apiRequest('/offers/subscriptions/my_subscription', { method: 'POST' });
      setOfferSubscribed(!offerSubscribed);
    } catch (requestError) {
      setProfileError(requestError instanceof Error ? requestError.message : 'Unable to update offer notifications.');
    } finally { setSubscriptionBusy(false); }
  };

  return (
    <CustomerScreen title="Your profile" subtitle="Keep your contact and pickup details up to date.">
      {loading ? <Notice>Loading profile…</Notice> : null}
      <Field label="Username" value={profile.username || ''} onChangeText={(value) => update('username', value)} />
      <Field label="First name" value={profile.first_name || ''} onChangeText={(value) => update('first_name', value)} />
      <Field label="Last name" value={profile.last_name || ''} onChangeText={(value) => update('last_name', value)} />
      <Field label="Phone number" value={profile.phone || ''} onChangeText={(value) => update('phone', value)} keyboardType="phone-pad" />
      <Text style={{ marginTop: 14, marginBottom: 8, color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Service location</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {locations.map((location) => <Pressable key={location.id} onPress={() => update('location', location.name)} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: profile.location === location.name ? colors.primary : colors.surface, borderWidth: 1, borderColor: profile.location === location.name ? colors.primary : colors.border, borderRadius: 8 }}><Text style={{ color: profile.location === location.name ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '700' }}>{location.name}</Text></Pressable>)}
        {!locations.length ? <Text style={{ color: colors.muted, fontSize: 12 }}>Locations unavailable. You can enter the location below.</Text> : null}
      </View>
      <Field label="Location (if not listed)" value={profile.location || ''} onChangeText={(value) => update('location', value)} />
      <Field label="Default pickup address" value={profile.pickup_address || ''} onChangeText={(value) => update('pickup_address', value)} multiline />
      <Field label="Pickup latitude" value={profile.pickup_latitude == null ? '' : String(profile.pickup_latitude)} onChangeText={(value) => update('pickup_latitude', value)} keyboardType="decimal-pad" placeholder="Optional map coordinate" />
      <Field label="Pickup longitude" value={profile.pickup_longitude == null ? '' : String(profile.pickup_longitude)} onChangeText={(value) => update('pickup_longitude', value)} keyboardType="decimal-pad" placeholder="Optional map coordinate" />
      {error ? <Notice error>{error}</Notice> : null}
      {message ? <Notice>{message}</Notice> : null}
      <ActionButton title="Save profile" onPress={save} loading={saving || loading} />
      <SectionTitle>Account</SectionTitle>
      <Link href="/bnpl" asChild><Text style={{ paddingVertical: 13, color: colors.primary, fontWeight: '800' }}>Buy now, pay later</Text></Link>
      <Link href="/orders" asChild><Text style={{ paddingVertical: 13, color: colors.primary, fontWeight: '800' }}>Your orders</Text></Link>
      <Link href="/offers" asChild><Text style={{ paddingVertical: 13, color: colors.primary, fontWeight: '800' }}>Browse offers</Text></Link>
      <Link href="/loans" asChild><Text style={{ paddingVertical: 13, color: colors.primary, fontWeight: '800' }}>My loan applications</Text></Link>
      <Link href="/tradein" asChild><Text style={{ paddingVertical: 13, color: colors.primary, fontWeight: '800' }}>My trade-ins</Text></Link>
      <View style={{ height: 1, marginTop: 8, backgroundColor: colors.border }} />
      {profileError ? <Notice error>{profileError}</Notice> : null}
      <SectionTitle>Pickup subscription</SectionTitle>
      {subscription ? <>
        <Notice>{subscription.frequency} pickups{subscription.next_pickup_date ? ` · Next pickup ${new Date(subscription.next_pickup_date).toLocaleDateString('en-KE')}` : ''}</Notice>
        <ActionButton title="Cancel pickup subscription" secondary loading={subscriptionBusy} onPress={() => void updateSubscription(null)} />
      </> : <>
        <Text style={{ marginTop: 6, color: colors.muted, fontSize: 12, lineHeight: 18 }}>Choose a regular pickup schedule.</Text>
        {(['weekly', 'bi-weekly', 'monthly'] as const).map((frequency) => <ActionButton key={frequency} title={`Subscribe ${frequency}`} secondary loading={subscriptionBusy} onPress={() => void updateSubscription(frequency)} />)}
      </>}
      <SectionTitle>Offer notifications</SectionTitle>
      <ActionButton title={offerSubscribed ? 'Disable offer SMS' : 'Subscribe to offer SMS'} secondary loading={subscriptionBusy} onPress={() => void toggleOfferSubscription()} />
      <SectionTitle>Claimed offers</SectionTitle>
      {claimedOffers.length ? claimedOffers.map((item) => <View key={item.id} style={{ marginTop: 8, padding: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}><Text style={{ color: colors.text, fontWeight: '800' }}>{item.offer.title}</Text><Text style={{ marginTop: 4, color: colors.muted, fontSize: 12 }}>{item.is_used ? 'Used' : 'Available'} · Claimed {new Date(item.claimed_at).toLocaleDateString('en-KE')}</Text></View>) : <Text style={{ marginTop: 7, color: colors.muted, fontSize: 12 }}>No claimed offers yet.</Text>}
      <ActionButton title="Sign out" secondary onPress={async () => { await clearAuthState(); router.replace('/login'); }} />
    </CustomerScreen>
  );
}