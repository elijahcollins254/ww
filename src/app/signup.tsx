import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Field, Notice } from '@/components/customer-ui';
import { apiRequest, saveAuthState, type UserProfile } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

type Location = { id: number; name: string; description?: string };

export default function SignupScreen() {
  const { colors } = useAppTheme();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest<Location[] | { results?: Location[] }>('/users/locations/').then((data) => setLocations(Array.isArray(data) ? data : data.results || [])).catch(() => setLocations([]));
  }, []);

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      if (!location) throw new Error('Select a service location.');
      await apiRequest('/users/register/', { method: 'POST', body: JSON.stringify({ username, phone, password, location }) });
      const auth = await apiRequest<{ token: string; user: UserProfile }>('/users/login/', { method: 'POST', body: JSON.stringify({ phone, password }) });
      await saveAuthState(auth.token, auth.user);
      router.replace('/profile');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerScreen title="Create an account" subtitle="Set up your Wild Wash account to book and track service pickups.">
      <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Choose a username" />
      <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0712345678" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" />
      <Text style={{ marginTop: 16, marginBottom: 8, color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Service location</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {locations.map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: location === item.name }} onPress={() => setLocation(item.name)} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: location === item.name ? colors.primary : colors.surface, borderWidth: 1, borderColor: location === item.name ? colors.primary : colors.border, borderRadius: 4 }}><Text style={{ color: location === item.name ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '700' }}>{item.name}</Text></Pressable>)}
        {!locations.length ? <Text style={{ color: colors.muted, fontSize: 12 }}>Service locations are currently unavailable.</Text> : null}
      </View>
      {error ? <Notice error>{error}</Notice> : null}
      <ActionButton title="Create account" onPress={submit} loading={loading} />
      <Link href="/login" asChild><Text style={{ marginTop: 18, color: '#64748B', textAlign: 'center' }}>Already have an account? Sign in</Text></Link>
    </CustomerScreen>
  );
}