import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { ActionButton, CustomerScreen, Notice } from '@/components/customer-ui';
import { FeatureCard } from '@/components/feature-ui';
import { useAppTheme } from '@/contexts/theme-context';
import { fetchServices, getServiceImageUrl, type Service } from '@/lib/api';
import { useCart } from '@/contexts/cart-context';

export default function ServicesScreen() {
  const { colors } = useAppTheme();
  const { addItem } = useCart();
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    fetchServices().then((result) => { if (active) setServices(result); }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load services.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const categories = useMemo(() => ['All', ...Array.from(new Set(services.map((service) => service.category || 'Other')))], [services]);
  const visibleServices = useMemo(() => services.filter((service) => {
    const matchesCategory = category === 'All' || (service.category || 'Other') === category;
    const search = `${service.name} ${service.category || ''} ${service.description || ''}`.toLowerCase();
    return matchesCategory && search.includes(query.trim().toLowerCase());
  }), [category, query, services]);
  return (
    <CustomerScreen title="Services" subtitle="Find a service, review its details, and add it to your cart.">
      <TextInput value={query} onChangeText={setQuery} placeholder="Search services" placeholderTextColor={colors.muted} style={{ minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.surface, color: colors.text }} />
      <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: category === item ? colors.primary : colors.chip, borderRadius: 18 }}><Text style={{ color: category === item ? '#FFFFFF' : colors.text, fontSize: 11, fontWeight: '700' }}>{item.replaceAll('-', ' ')}</Text></Pressable>)}</View>
      {loading ? <Notice>Loading services…</Notice> : error ? <Notice error>{error}</Notice> : visibleServices.length === 0 ? <Notice>No services match your search.</Notice> : visibleServices.map((service) => {
        const image = getServiceImageUrl(service.image_url);
        return <FeatureCard key={service.id}>
          <Pressable onPress={() => router.push(`/services/${service.id}` as never)}>
            {image ? <Image source={{ uri: image }} contentFit="cover" style={{ width: '100%', height: 170, borderRadius: 8, backgroundColor: colors.image }} /> : null}
            <Text style={{ marginTop: image ? 12 : 0, color: colors.text, fontSize: 16, fontWeight: '900' }}>{service.name}</Text>
            <Text style={{ marginTop: 4, color: colors.muted, fontSize: 11, textTransform: 'capitalize' }}>{(service.category || 'Service').replaceAll('-', ' ')}</Text>
            <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13, lineHeight: 19 }} numberOfLines={3}>{service.description || 'Professional Wild Wash service with pickup and delivery available.'}</Text>
            <Text style={{ marginTop: 9, color: colors.primary, fontSize: 16, fontWeight: '900' }}>KSh {Number(service.price).toLocaleString('en-KE')}</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <View style={{ flex: 1 }}><ActionButton title="Details" secondary onPress={() => router.push(`/services/${service.id}` as never)} /></View>
            <View style={{ flex: 1 }}><ActionButton title="Add to cart" onPress={() => { addItem(service); setMessage(`${service.name} added to your cart.`); }} /></View>
          </View>
        </FeatureCard>;
      })}
      {message ? <Notice>{message}</Notice> : null}
      <ActionButton title="Open cart" secondary onPress={() => router.push('/cart')} />
    </CustomerScreen>
  );
}
