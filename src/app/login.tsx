import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Text } from 'react-native';

import { ActionButton, CustomerScreen, Field, Notice } from '@/components/customer-ui';
import { apiRequest, saveAuthState, type UserProfile } from '@/lib/api';
import { getGoogleRedirectPath, signInWithGoogle } from '@/lib/googleAuth';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<{ token: string; user: UserProfile }>('/users/login/', {
        method: 'POST', body: JSON.stringify({ phone, password }),
      });
      await saveAuthState(result.token, result.user);
      router.replace(getGoogleRedirectPath(result.user));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      router.replace(getGoogleRedirectPath(result.user));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <CustomerScreen title="Welcome back" subtitle="Sign in to manage pickups, payments and your Wild Wash account.">
      <ActionButton title={googleLoading ? 'Signing in with Google…' : 'Continue with Google'} onPress={() => void handleGoogle()} loading={googleLoading} />
      <Text style={{ marginTop: 14, color: '#64748B', textAlign: 'center', fontSize: 12, fontWeight: '700' }}>or continue with phone</Text>
      <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="0712345678" keyboardType="phone-pad" autoComplete="tel" />
      <Field label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry autoComplete="password" />
      {error ? <Notice error>{error}</Notice> : null}
      <ActionButton title="Sign in" onPress={submit} loading={loading} />
      <Link href="/reset-password" asChild><Text style={{ marginTop: 18, color: '#E10613', textAlign: 'center', fontWeight: '700' }}>Forgot password?</Text></Link>
      <Link href="/signup" asChild><Text style={{ marginTop: 14, color: '#64748B', textAlign: 'center' }}>New to Wild Wash? <Text style={{ color: '#E10613', fontWeight: '800' }}>Create an account</Text></Text></Link>
    </CustomerScreen>
  );
}
