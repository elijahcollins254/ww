import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Field, Notice, SectionTitle } from '@/components/customer-ui';
import { apiRequest, clearAuthState, getAuthState, type UserProfile } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const [profile, setProfile] = useState<UserProfile>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getAuthState().then((auth) => {
      if (!auth?.token) {
        router.replace('/login');
        return null;
      }
      return apiRequest<UserProfile>('/users/me/');
    }).then((data) => { if (active && data) setProfile(data); }).catch((requestError) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load profile.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = (key: keyof UserProfile, value: string) => setProfile((current) => ({ ...current, [key]: value }));
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

  return (
    <CustomerScreen title="Your profile" subtitle="Keep your contact and pickup details up to date.">
      {loading ? <Notice>Loading profile…</Notice> : null}
      <Field label="Username" value={profile.username || ''} onChangeText={(value) => update('username', value)} />
      <Field label="First name" value={profile.first_name || ''} onChangeText={(value) => update('first_name', value)} />
      <Field label="Last name" value={profile.last_name || ''} onChangeText={(value) => update('last_name', value)} />
      <Field label="Phone number" value={profile.phone || ''} onChangeText={(value) => update('phone', value)} keyboardType="phone-pad" />
      <Field label="Service location" value={profile.location || ''} onChangeText={(value) => update('location', value)} />
      <Field label="Default pickup address" value={profile.pickup_address || ''} onChangeText={(value) => update('pickup_address', value)} multiline />
      {error ? <Notice error>{error}</Notice> : null}
      {message ? <Notice>{message}</Notice> : null}
      <ActionButton title="Save profile" onPress={save} loading={saving || loading} />
      <SectionTitle>Account</SectionTitle>
      <Link href="/bnpl" asChild><Text style={{ paddingVertical: 13, color: colors.primary, fontWeight: '800' }}>Buy now, pay later</Text></Link>
      <Link href="/orders" asChild><Text style={{ paddingVertical: 13, color: colors.primary, fontWeight: '800' }}>Your orders</Text></Link>
      <View style={{ height: 1, marginTop: 8, backgroundColor: colors.border }} />
      <ActionButton title="Sign out" secondary onPress={async () => { await clearAuthState(); router.replace('/login'); }} />
    </CustomerScreen>
  );
}