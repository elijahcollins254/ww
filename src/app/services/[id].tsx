import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Notice } from '@/components/customer-ui';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest, getServiceImageUrl, type Service } from '@/lib/api';
import { useCart } from '@/contexts/cart-context';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { addItem } = useCart();
  const [service, setService] = useState<Service | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    apiRequest<Service>(`/services/${encodeURIComponent(id)}/`).then(setService).catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Service not found.'));
  }, [id]);

  if (!service) return <CustomerScreen title="Service details">{error ? <Notice error>{error}</Notice> : <Notice>Loading service…</Notice>}</CustomerScreen>;
  const imageUrl = getServiceImageUrl(service.image_url);
  return (
    <CustomerScreen title={service.name} subtitle={(service.category || 'Service').replaceAll('-', ' ')}>
      {imageUrl ? <Image source={{ uri: imageUrl }} contentFit="cover" style={{ width: '100%', height: 250, borderRadius: 5, backgroundColor: colors.image }} /> : null}
      <Text style={{ marginTop: 18, color: colors.text, fontSize: 22, fontWeight: '900' }}>KSh {Number(service.price).toLocaleString('en-KE')}</Text>
      <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14, lineHeight: 21 }}>{service.description || 'Professional Wild Wash service.'}</Text>
      <View style={{ marginTop: 20, padding: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 5 }}>
        {['Professional service', 'Quality guaranteed', 'Pickup and delivery available'].map((item) => <Text key={item} style={{ paddingVertical: 5, color: colors.text }}>✓  {item}</Text>)}
      </View>
      <ActionButton title="Add to cart" onPress={() => addItem(service)} />
      <Pressable onPress={() => router.push('/cart')} style={{ padding: 14, alignItems: 'center' }}><Text style={{ color: colors.primary, fontWeight: '800' }}>View cart</Text></Pressable>
    </CustomerScreen>
  );
}