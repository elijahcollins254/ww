import * as AuthSession from 'expo-auth-session';

import { apiRequest, saveAuthState, type UserProfile } from '@/lib/api';

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export function getGoogleRedirectPath(user?: Partial<UserProfile> & { role?: string; is_staff?: boolean; is_superuser?: boolean; profile_complete?: boolean }) {
  if (!user) return '/';

  if (user.profile_complete === false) return '/profile';
  if (user.is_superuser || user.role === 'admin') return '/admin';
  if (user.role === 'washer') return '/staff/washer';
  if (user.role === 'folder') return '/staff/folder';
  if (user.role === 'rider') return '/rider';
  if (user.is_staff || user.role === 'staff') return '/staff';

  return '/';
}

export async function signInWithGoogle() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_CLIENT_ID. Add your Google OAuth web client ID to the Expo .env file before using Google sign-in.');
  }

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'ww' });
  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account',
    responseType: 'token',
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY, { useProxy: false });

  if (result.type !== 'success' || !result.params.access_token) {
    throw new Error(result.type === 'cancel' ? 'Google sign-in was cancelled.' : 'Google sign-in failed.');
  }

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${result.params.access_token}` },
  });

  if (!profileResponse.ok) {
    const errorText = await profileResponse.text().catch(() => '');
    throw new Error(errorText || 'Unable to load your Google profile.');
  }

  const googleProfile = await profileResponse.json() as { email?: string; name?: string; id?: string };

  if (!googleProfile.email) {
    throw new Error('Google did not return an email address for this account.');
  }

  const auth = await apiRequest<{ token: string; user: UserProfile }>('/users/google-auth/', {
    method: 'POST',
    body: JSON.stringify({
      email: googleProfile.email,
      name: googleProfile.name || googleProfile.email.split('@')[0],
      google_id: googleProfile.id || googleProfile.email,
    }),
  });

  await saveAuthState(auth.token, auth.user);
  return auth;
}
