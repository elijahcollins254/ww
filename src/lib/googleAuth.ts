import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { apiRequest, saveAuthState, type UserProfile } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

function getGoogleClientId() {
  const clientId = Platform.select({
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  }) || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('Set the platform-specific EXPO_PUBLIC_GOOGLE_*_CLIENT_ID for Google sign-in.');
  }

  return clientId;
}

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
  const clientId = getGoogleClientId();
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'ww' });
  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account',
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY, { useProxy: false });

  if (result.type !== 'success' || !result.params.code) {
    throw new Error(result.type === 'cancel' ? 'Google sign-in was cancelled.' : 'Google sign-in failed.');
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync({
    clientId,
    code: result.params.code,
    redirectUri,
    extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : {},
  }, GOOGLE_DISCOVERY);

  if (!tokenResponse.idToken) {
    throw new Error('Google did not return an ID token. Check the OAuth client configuration.');
  }

  const auth = await apiRequest<{ token: string; user: UserProfile }>('/users/google-auth/mobile/', {
    method: 'POST',
    body: JSON.stringify({ id_token: tokenResponse.idToken }),
  });

  await saveAuthState(auth.token, auth.user);
  return auth;
}
