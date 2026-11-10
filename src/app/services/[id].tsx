import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ActionButton, CustomerScreen, Notice } from '@/components/customer-ui';
import { useAppTheme } from '@/contexts/theme-context';
import { apiRequest, fetchServices, getServiceImageUrl, type Service } from '@/lib/api';
import { useCart } from '@/contexts/cart-context';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const { addItem } = useCart();
  const [service, setService] = useState<Service | null>(null);
  const [error, setError] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [relatedServicesError, setRelatedServicesError] = useState('');
  const [relatedServicesLoading, setRelatedServicesLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setRelatedServicesLoading(true);
    setRelatedServicesError('');
    apiRequest<Service>(`/services/${encodeURIComponent(id)}/`, { signal: controller.signal })
      .then(setService)
      .catch((requestError) => {
        if (!(requestError instanceof Error && requestError.name === 'AbortError')) {
          setError(requestError instanceof Error ? requestError.message : 'Service not found.');
        }
      });
    fetchServices(controller.signal)
      .then((items) => {
        setServices(items);
        setRelatedServicesLoading(false);
      })
      .catch((requestError: unknown) => {
        if (!(requestError instanceof Error && requestError.name === 'AbortError')) {
          setRelatedServicesError(requestError instanceof Error ? requestError.message : 'Related services could not be loaded.');
          setRelatedServicesLoading(false);
        }
      });
    return () => controller.abort();
  }, [id]);

  if (!service) return <CustomerScreen title="Service details">{error ? <Notice error>{error}</Notice> : <Notice>Loading service…</Notice>}</CustomerScreen>;
  const imageUrl = getServiceImageUrl(service.image_url);
  const otherServices = services.filter((item) => item.id !== service.id);
  const sameCategoryServices = otherServices.filter((item) => item.category === service.category);
  const relatedServices = (sameCategoryServices.length > 0 ? sameCategoryServices : otherServices).slice(0, 8);

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

      <View style={{ marginTop: 22 }}>
        <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>More to explore</Text>
        <Text style={{ marginTop: 3, marginBottom: 12, color: colors.text, fontSize: 19, fontWeight: '900' }}>Related services</Text>
        {relatedServicesLoading ? (
          <Text style={{ color: colors.muted, fontSize: 12 }}>Loading related services…</Text>
        ) : relatedServicesError ? (
          <Notice error>{relatedServicesError}</Notice>
        ) : relatedServices.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
            {relatedServices.map((relatedService) => {
              const relatedImageUrl = getServiceImageUrl(relatedService.image_url);
              return (
                <View key={relatedService.id} style={{ width: 230, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: 5, backgroundColor: colors.card }}>
                  <Pressable onPress={() => router.push(`/services/${relatedService.id}` as never)}>
                    {relatedImageUrl ? (
                      <Image source={{ uri: relatedImageUrl }} contentFit="cover" style={{ width: '100%', height: 140, backgroundColor: colors.image }} />
                    ) : (
                      <View style={{ height: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.image }}>
                        <Text style={{ color: colors.primary, fontSize: 25, fontWeight: '900' }}>WW</Text>
                      </View>
                    )}
                    <View style={{ minHeight: 116, padding: 13 }}>
                      <Text numberOfLines={2} style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{relatedService.name}</Text>
                      {relatedService.description ? (
                        <Text numberOfLines={2} style={{ marginTop: 5, color: colors.muted, fontSize: 11, lineHeight: 15 }}>{relatedService.description}</Text>
                      ) : null}
                      <Text style={{ marginTop: 10, color: colors.text, fontSize: 16, fontWeight: '900' }}>KSh {Number(relatedService.price).toLocaleString('en-KE')}</Text>
                    </View>
                  </Pressable>
                  <View style={{ paddingHorizontal: 13, paddingBottom: 13 }}>
                    <ActionButton title="Add to cart" onPress={() => addItem(relatedService)} />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
    </CustomerScreen>
  );
}