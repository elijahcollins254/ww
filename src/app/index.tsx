import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import WhatsAppButton from '@/components/whatsapp-button';
import { useCart } from '@/contexts/cart-context';
import { useAppTheme } from '@/contexts/theme-context';
import { API_BASE_URL, fetchServices, getServiceImageUrl, type Service } from '@/lib/api';

const categories = [
  { value: 'laundry', label: 'Laundry' },
  { value: 'duvet-cleaning', label: 'Duvet' },
  { value: 'carpet-cleaning', label: 'Carpet' },
  { value: 'house-cleaning', label: 'House' },
  { value: 'fumigation', label: 'Fumigation' },
  { value: 'sofa-cleaning', label: 'Sofa' },
  { value: 'moving-services', label: 'Moving' },
  { value: 'storage-services', label: 'Storage' },
  { value: 'tv-mounting-hot-shower-installation', label: 'Installation' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'repairs', label: 'Repairs' },
];

function formatPrice(price: number | string) {
  const amount = Number(price);
  return `KSh ${Number.isFinite(amount) ? amount.toLocaleString('en-KE') : price}`;
}

function categoryName(category?: string | null) {
  return (category || 'Care').replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ServiceCard({ service, onAdd }: { service: Service; onAdd: (service: Service) => void }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const imageUrl = getServiceImageUrl(service.image_url);

  return (
    <View style={styles.card}>
      <View style={styles.cardImage}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.fallbackMark}>WW</Text>
            <Text style={styles.fallbackCategory}>{categoryName(service.category)}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Pressable onPress={() => router.push(`/services/${service.id}` as never)}><Text numberOfLines={2} style={styles.serviceName}>{service.name}</Text></Pressable>
        {service.description ? (
          <Text numberOfLines={2} style={styles.description}>{service.description}</Text>
        ) : <View style={styles.descriptionSpacer} />}
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{formatPrice(service.price)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${service.name} to cart`}
            onPress={() => onAdd(service)}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Text style={styles.addButtonText}>Add to cart</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { addItem } = useCart();
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchServices(controller.signal)
      .then(setServices)
      .catch((loadError: unknown) => {
        if (!(loadError instanceof Error && loadError.name === 'AbortError')) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load services.');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [reloadKey]);

  const filteredServices = useMemo(() => services.filter((service) => {
    const searchable = `${service.name} ${service.category || ''} ${service.description || ''}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase())
      && (!selectedCategory || service.category === selectedCategory);
  }), [query, selectedCategory, services]);
  const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.page}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Search services"
            placeholder="Search services"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {query.length > 0 && <Pressable onPress={() => setQuery('')}><Text style={styles.clearSearch}>CLEAR</Text></Pressable>}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroller}
          contentContainerStyle={styles.categoryRow}>
          <Pressable onPress={() => setSelectedCategory(null)} style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}>
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All</Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable key={category.value} onPress={() => setSelectedCategory(selectedCategory === category.value ? null : category.value)} style={[styles.categoryChip, selectedCategory === category.value && styles.categoryChipActive]}>
              <Text style={[styles.categoryText, selectedCategory === category.value && styles.categoryTextActive]}>{category.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{selectedCategory ? categories.find(({ value }) => value === selectedCategory)?.label || categoryName(selectedCategory) : 'All Services'}</Text>
          {!loading && <Text style={styles.resultCount}>{filteredServices.length}</Text>}
        </View>

        {loading ? (
          <View style={styles.stateBox}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Finding the right care...</Text></View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Services are taking a moment</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={() => { setLoading(true); setError(null); setReloadKey((current) => current + 1); }} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
            <Text style={styles.apiHint}>{API_BASE_URL}</Text>
          </View>
        ) : filteredServices.length === 0 ? (
          <View style={styles.stateBox}><Text style={styles.stateTitle}>No matching services</Text><Text style={styles.stateText}>Try another search or category.</Text></View>
        ) : (
          <FlatList
            key={columns}
            data={filteredServices}
            keyExtractor={(item) => String(item.id)}
            numColumns={columns}
            columnWrapperStyle={styles.cardRow}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { setLoading(true); setReloadKey((current) => current + 1); }} tintColor={colors.primary} />}
            renderItem={({ item }) => <ServiceCard service={item} onAdd={addItem} />}
          />
        )}
      </View>
      <WhatsAppButton />
    </SafeAreaView>
  );
}

function createStyles(colors: (typeof Colors)[keyof typeof Colors]) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.header },
    page: { flex: 1, width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 16, backgroundColor: colors.background },
    searchWrap: { height: 52, flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingHorizontal: 15, backgroundColor: colors.search, borderWidth: 1, borderColor: colors.border, borderRadius: 28 },
    searchIcon: { color: colors.muted, fontSize: 23, lineHeight: 27, marginRight: 10 },
    searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 0 },
    clearSearch: { color: colors.primary, fontSize: 9, fontWeight: '800', paddingLeft: 10 },
    categoryScroller: { height: 64, flexGrow: 0, flexShrink: 0, maxWidth: '100%', marginTop: 4 },
    categoryRow: { alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4 },
    categoryChip: { paddingHorizontal: 17, paddingVertical: 11, backgroundColor: colors.chip, borderRadius: 22 },
    categoryChipActive: { backgroundColor: colors.primary },
    categoryText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    categoryTextActive: { color: '#FFFFFF' },
    sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-start', gap: 8, paddingTop: 12, paddingBottom: 30 },
    sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
    resultCount: { color: colors.muted, fontSize: 14 },
    listContent: { paddingBottom: 92 },
    cardRow: { gap: 14, marginBottom: 14 },
    card: { flex: 1, minWidth: 0, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 17, overflow: 'hidden' },
    cardImage: { height: 160, backgroundColor: colors.image, position: 'relative' },
    image: { width: '100%', height: '100%' },
    imageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.image },
    fallbackMark: { color: colors.primary, fontSize: 28, fontWeight: '900' },
    fallbackCategory: { marginTop: 2, color: colors.muted, fontSize: 10 },
    cardBody: { minHeight: 207, padding: 15, justifyContent: 'space-between' },
    serviceName: { minHeight: 42, color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '700' },
    description: { minHeight: 36, marginTop: 6, color: colors.muted, fontSize: 11, lineHeight: 15 },
    descriptionSpacer: { minHeight: 42 },
    cardFooter: { flexDirection: 'column', alignItems: 'stretch', marginTop: 12, gap: 14 },
    price: { flexShrink: 1, color: colors.text, fontSize: 17, fontWeight: '800' },
    addButton: { minHeight: 40, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    pressed: { opacity: 0.75 },
    stateBox: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
    stateTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
    stateText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
    apiHint: { color: colors.muted, fontSize: 10, textAlign: 'center' },
    retryButton: { marginTop: 4, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 8 },
    retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  });
}
