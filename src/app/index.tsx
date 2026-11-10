import { useEffect, useMemo, useRef, useState } from 'react';
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
import { API_BASE_URL, apiRequest, fetchServices, getServiceImageUrl, type Service } from '@/lib/api';

const promoSlides = [
  {
    eyebrow: 'Wild Wash, made easy',
    title: 'More time for what matters.',
    description: 'Book laundry and home-care services from one simple place.',
    action: 'Explore services',
    href: '/services',
    backgroundColor: '#B91C1C',
  },
  {
    eyebrow: 'Fresh deals, real savings',
    title: 'Find your next great offer.',
    description: 'See current offers and claim the ones that work for you.',
    action: 'View offers',
    href: '/offers',
    backgroundColor: '#0F172A',
  },
  {
    eyebrow: 'Care for your home',
    title: 'Laundry is just the beginning.',
    description: 'Explore cleaning, fumigation, repairs and more.',
    action: 'Browse all services',
    href: '/services',
    backgroundColor: '#166534',
  },
];

type Offer = {
  id: number;
  title: string;
  description: string;
  discount_percent: number;
  discount_amount: number;
  is_active: boolean;
  valid_from?: string;
  valid_until: string | null;
};

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
  const [activePromo, setActivePromo] = useState(0);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [offersError, setOffersError] = useState(false);
  const promoCarouselRef = useRef<ScrollView>(null);
  const carouselWidth = Math.max(width - 32, 1);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromo((current) => (current + 1) % promoSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    promoCarouselRef.current?.scrollTo({ x: activePromo * carouselWidth, animated: true });
  }, [activePromo, carouselWidth]);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    apiRequest<Offer[] | { results?: Offer[] }>('/offers', { signal: controller.signal })
      .then((response) => {
        const items = Array.isArray(response) ? response : response.results || [];
        const now = Date.now();
        const currentOffers = items.filter((offer) => {
          const startsAt = offer.valid_from ? new Date(offer.valid_from).getTime() : 0;
          const endsAt = offer.valid_until ? new Date(offer.valid_until).getTime() : Infinity;
          return offer.is_active && startsAt <= now && endsAt >= now;
        });
        if (isMounted) setOffers(currentOffers.slice(0, 3));
      })
      .catch((loadError: unknown) => {
        if (isMounted && !(loadError instanceof Error && loadError.name === 'AbortError')) {
          console.error('Error fetching homepage offers:', loadError);
          setOffersError(true);
        }
      })
      .finally(() => {
        if (isMounted) setOffersLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const filteredServices = useMemo(() => services.filter((service) => {
    const searchable = `${service.name} ${service.category || ''} ${service.description || ''}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase())
      && (!selectedCategory || service.category === selectedCategory);
  }), [query, selectedCategory, services]);
  const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const refreshServices = () => {
    setLoading(true);
    setError(null);
    setReloadKey((current) => current + 1);
  };

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
        <FlatList
          key={columns}
          data={loading || error ? [] : filteredServices}
          keyExtractor={(item) => String(item.id)}
          numColumns={columns}
          columnWrapperStyle={styles.cardRow}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshServices} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View>
              <ScrollView
                ref={promoCarouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
                  setActivePromo(Math.min(index, promoSlides.length - 1));
                }}
                style={styles.promoCarousel}
                contentContainerStyle={styles.promoCarouselContent}>
                {promoSlides.map((slide) => (
                  <View key={slide.title} style={[styles.promoCard, { width: carouselWidth, backgroundColor: slide.backgroundColor }]}>
                    <Text style={styles.promoEyebrow}>{slide.eyebrow}</Text>
                    <Text style={styles.promoTitle}>{slide.title}</Text>
                    <Text style={styles.promoDescription}>{slide.description}</Text>
                    <Pressable accessibilityRole="link" onPress={() => router.push(slide.href as never)} style={styles.promoAction}>
                      <Text style={styles.promoActionText}>{slide.action}  ›</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.promoDots} accessibilityLabel="Promotion slides">
                {promoSlides.map((slide, index) => (
                  <Pressable
                    key={slide.title}
                    accessibilityRole="button"
                    accessibilityLabel={`Show promotion ${index + 1}`}
                    accessibilityState={{ selected: activePromo === index }}
                    onPress={() => setActivePromo(index)}
                    style={[styles.promoDot, activePromo === index && styles.promoDotActive]}
                  />
                ))}
              </View>

              <View style={styles.offersSection}>
                <View style={styles.offersHeading}>
                  <View>
                    <Text style={styles.offersEyebrow}>Save on your next order</Text>
                    <Text style={styles.offersTitle}>Current offers</Text>
                  </View>
                  <Pressable accessibilityRole="link" onPress={() => router.push('/offers')}>
                    <Text style={styles.offersLink}>All offers  ›</Text>
                  </Pressable>
                </View>
                {offersLoading ? (
                  <View style={styles.offersState}><ActivityIndicator color={colors.primary} /></View>
                ) : offersError ? (
                  <View style={styles.offersMessage}>
                    <Text style={styles.offersMessageText}>Current offers couldn’t be loaded.</Text>
                  </View>
                ) : offers.length > 0 ? offers.map((offer) => (
                  <Pressable key={offer.id} onPress={() => router.push('/offers')} style={styles.offerCard}>
                    <View style={styles.offerCopy}>
                      <Text style={styles.offerTitle}>{offer.title}</Text>
                      <Text numberOfLines={2} style={styles.offerDescription}>{offer.description}</Text>
                      <Text style={styles.offerSee}>See offer  ›</Text>
                    </View>
                    <Text style={styles.offerBadge}>
                      {offer.discount_percent > 0 ? `${offer.discount_percent}% OFF` : `KSh ${offer.discount_amount} OFF`}
                    </Text>
                  </Pressable>
                )) : (
                  <View style={styles.offersMessage}>
                    <Text style={styles.offersMessageText}>No current offers right now. Check back soon.</Text>
                  </View>
                )}
              </View>

              <View style={styles.benefits}>
                <View style={styles.benefit}><Text style={styles.benefitMark}>↗</Text><Text style={styles.benefitText}>Book services online</Text></View>
                <View style={styles.benefit}><Text style={styles.benefitMark}>%</Text><Text style={styles.benefitText}>Discover live offers</Text></View>
                <View style={styles.benefit}><Text style={styles.benefitMark}>✓</Text><Text style={styles.benefitText}>Simple online checkout</Text></View>
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
                {!loading && !error && <Text style={styles.resultCount}>{filteredServices.length}</Text>}
              </View>
              <Text style={styles.trustedBy}>Trusted by 597903+ users</Text>
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.stateBox}><ActivityIndicator color={colors.primary} /><Text style={styles.stateText}>Finding the right care...</Text></View>
            ) : error ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateTitle}>Services are taking a moment</Text>
                <Text style={styles.stateText}>{error}</Text>
                <Pressable onPress={refreshServices} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
                <Text style={styles.apiHint}>{API_BASE_URL}</Text>
              </View>
            ) : (
              <View style={styles.stateBox}><Text style={styles.stateTitle}>No matching services</Text><Text style={styles.stateText}>Try another search or category.</Text></View>
            )
          }
          renderItem={({ item }) => <ServiceCard service={item} onAdd={addItem} />}
        />
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
    promoCarousel: { height: 208, marginTop: 16, borderRadius: 18, overflow: 'hidden' },
    promoCarouselContent: { alignItems: 'stretch' },
    promoCard: { minHeight: 208, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 18, borderRadius: 18 },
    promoEyebrow: { color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
    promoTitle: { maxWidth: 310, marginTop: 9, color: '#FFFFFF', fontSize: 24, lineHeight: 29, fontWeight: '900' },
    promoDescription: { maxWidth: 330, marginTop: 7, color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 19 },
    promoAction: { alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#FFFFFF', borderRadius: 20 },
    promoActionText: { color: '#111827', fontSize: 11, fontWeight: '800' },
    promoDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 10, marginBottom: 18 },
    promoDot: { width: 7, height: 7, backgroundColor: colors.border, borderRadius: 5 },
    promoDotActive: { width: 24, backgroundColor: colors.primary },
    offersSection: { marginBottom: 18 },
    offersHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
    offersEyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
    offersTitle: { marginTop: 3, color: colors.text, fontSize: 18, fontWeight: '900' },
    offersLink: { color: colors.primary, fontSize: 12, fontWeight: '800' },
    offersState: { minHeight: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.surface },
    offersMessage: { padding: 14, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    offersMessageText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
    offerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 9, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.backgroundSelected, backgroundColor: colors.surface },
    offerCopy: { flex: 1 },
    offerTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
    offerDescription: { marginTop: 4, color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
    offerSee: { marginTop: 8, color: colors.primary, fontSize: 11, fontWeight: '800' },
    offerBadge: { overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6, color: '#FFFFFF', backgroundColor: colors.primary, borderRadius: 14, fontSize: 10, fontWeight: '900' },
    benefits: { flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginBottom: 12, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.surface },
    benefit: { flex: 1, alignItems: 'center', gap: 6 },
    benefitMark: { width: 28, height: 28, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', color: colors.primary, backgroundColor: colors.background, borderRadius: 9, fontSize: 16, fontWeight: '900' },
    benefitText: { color: colors.text, fontSize: 9, lineHeight: 13, fontWeight: '700', textAlign: 'center' },
    categoryScroller: { height: 64, flexGrow: 0, flexShrink: 0, maxWidth: '100%', marginTop: 2 },
    categoryRow: { alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4 },
    categoryChip: { paddingHorizontal: 17, paddingVertical: 11, backgroundColor: colors.chip, borderRadius: 22 },
    categoryChipActive: { backgroundColor: colors.primary },
    categoryText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    categoryTextActive: { color: '#FFFFFF' },
    sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-start', gap: 8, paddingTop: 12, paddingBottom: 3 },
    sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
    resultCount: { color: colors.muted, fontSize: 14 },
    trustedBy: { marginBottom: 18, color: colors.textSecondary, fontSize: 11, fontWeight: '700', textAlign: 'center' },
    listContent: { paddingBottom: 92, flexGrow: 1 },
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
