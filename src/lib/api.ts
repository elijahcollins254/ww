import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'https://api.wildwash.co.ke';

export type Service = {
  id: number;
  name: string;
  category?: string | null;
  price: number | string;
  description?: string | null;
  image_url?: string | null;
};

export type UserProfile = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  location?: string;
  pickup_address?: string;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  profile_complete?: boolean;
};

export const AUTH_STORAGE_KEY = 'wildwash-auth-state';

export async function getAuthState(): Promise<{ token: string; user?: UserProfile } | null> {
  const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as { token: string; user?: UserProfile };
  } catch {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export async function saveAuthState(token: string, user?: UserProfile) {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
}

export async function clearAuthState() {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = await getAuthState();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(auth?.token ? { Authorization: `Token ${auth.token}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.detail || Object.values(payload || {}).flat().join(' ');
    throw new Error(detail || `Request failed (${response.status}).`);
  }
  return payload as T;
}

export function getServiceImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

export async function fetchServices(signal?: AbortSignal): Promise<Service[]> {
  let url: string | null = `${API_BASE_URL}/services/`;
  const services: Service[] = [];

  while (url) {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Services could not be loaded (${response.status}).`);
    }

    const payload: unknown = await response.json();
    if (Array.isArray(payload)) {
      services.push(...(payload as Service[]));
      break;
    }

    if (payload && typeof payload === 'object' && 'results' in payload) {
      const page = payload as { results?: unknown; next?: string | null };
      if (!Array.isArray(page.results)) {
        throw new Error('The services response had an unexpected format.');
      }
      services.push(...(page.results as Service[]));
      url = page.next ?? null;
      continue;
    }

    throw new Error('The services response had an unexpected format.');
  }

  return services;
}