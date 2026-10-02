import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { ActionButton, CustomerScreen, Field, Notice, SectionTitle } from '@/components/customer-ui';
import { Colors } from '@/constants/theme';
import { useCart } from '@/contexts/cart-context';
import { apiRequest } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

export default function BookingScreen() {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const { items, subtotal, clearCart } = useCart();
  const [pickup, setPickup] = useState('');
  const [phone, setPhone] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [sameAddress, setSameAddress] = useState(true);
  const [note, setNote] = useState('');
  const [schedule, setSchedule] = useState('');
  const [scheduleOption, setScheduleOption] = useState<'now' | 'scheduled'>('now');
  const [schedulePickerOpen, setSchedulePickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [draftTime, setDraftTime] = useState('10:00');
  const [schedulePickerError, setSchedulePickerError] = useState('');
  const [deliveryHours, setDeliveryHours] = useState(72);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    apiRequest<{ phone?: string; pickup_address?: string }>('/users/me/')
      .then((profile) => {
        setPhone(profile.phone || '');
        setPickup(profile.pickup_address || '');
      })
      .catch(() => undefined);
  }, []);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const pricePoints = [
    { hours: 6, multiplier: 2 }, { hours: 12, multiplier: 1.6 }, { hours: 24, multiplier: 1.3 },
    { hours: 36, multiplier: 1.1 }, { hours: 48, multiplier: 1 }, { hours: 72, multiplier: 1 },
  ];
  const minDeliveryHours = items.length
    ? Math.min(Math.max(...items.map(({ service, quantity }) => (
      ((service as typeof service & { processing_time?: number }).processing_time || 12) * quantity
    )), 6), 72)
    : 72;
  const effectiveDeliveryHours = Math.max(deliveryHours, minDeliveryHours);
  const multiplier = calculatePriceMultiplier(effectiveDeliveryHours, pricePoints);
  const finalTotal = subtotal * multiplier;

  const updateSliderValue = (event: GestureResponderEvent) => {
    if (sliderWidth <= 0 || minDeliveryHours >= 72) return;
    const trackWidth = Math.max(1, sliderWidth - 22);
    const progress = Math.max(0, Math.min(1, (event.nativeEvent.locationX - 11) / trackWidth));
    setDeliveryHours(Math.round(minDeliveryHours + progress * (72 - minDeliveryHours)));
  };

  const openSchedulePicker = () => {
    const current = schedule ? new Date(schedule) : new Date(Date.now() + 60 * 60 * 1000);
    const initialDate = Number.isNaN(current.getTime()) ? new Date() : current;
    setDraftDate(new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate()));
    setCalendarMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    setDraftTime(`${String(initialDate.getHours()).padStart(2, '0')}:${String(initialDate.getMinutes()).padStart(2, '0')}`);
    setSchedulePickerError('');
    setScheduleOption('scheduled');
    setSchedulePickerOpen(true);
  };

  const closeSchedulePicker = () => {
    setSchedulePickerOpen(false);
    if (!schedule) setScheduleOption('now');
  };

  const confirmSchedule = () => {
    const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(draftTime.trim());
    if (!timeMatch) {
      setSchedulePickerError('Enter a valid time in 24-hour format, such as 14:30.');
      return;
    }
    const pickupDate = new Date(
      draftDate.getFullYear(), draftDate.getMonth(), draftDate.getDate(),
      Number(timeMatch[1]), Number(timeMatch[2]),
    );
    setSchedule(pickupDate.toISOString());
    setScheduleOption('scheduled');
    setSchedulePickerOpen(false);
  };

  const submit = async () => {
    if (!items.length || !pickup.trim() || phone.replace(/\D/g, '').length < 10 || (!sameAddress && !dropoff.trim()) || (scheduleOption === 'scheduled' && !schedule)) {
      setError('Add at least one service, a pickup address, a valid phone number and a dropoff address if different.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiRequest('/orders/', { method: 'POST', body: JSON.stringify({
        services: items.map(({ service }) => service.id),
        service_quantities: items.map(({ service, quantity }) => ({ service_id: service.id, quantity })),
        pickup_address: `${pickup} (contact: ${phone})`,
        dropoff_address: sameAddress ? pickup : dropoff,
        urgency: multiplier === 2 ? 3 : multiplier === 1.3 ? 2 : 1,
        items: totalCount,
        price: Math.round(finalTotal * 100) / 100,
        estimated_delivery: new Date(Date.now() + effectiveDeliveryHours * 3600000).toISOString(),
        ...(note.trim() ? { description: note.trim() } : {}),
        ...(scheduleOption === 'scheduled' && schedule ? { requested_pickup_at: schedule } : {}),
      }) });
      clearCart();
      router.replace('/orders');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to book pickup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerScreen title="Book a pickup" subtitle="Confirm the collection, delivery and timing details for your services.">
      <SectionTitle>Pickup details</SectionTitle>
      <Field label="Pickup address" value={pickup} onChangeText={setPickup} placeholder="Building, street and area" multiline />
      <Field label="Contact phone" value={phone} onChangeText={setPhone} placeholder="0712345678" keyboardType="phone-pad" />
      <SectionTitle>Delivery Time &amp; Price</SectionTitle>
      <View style={styles.deliveryBlock}>
        <View style={styles.deliveryHeading}>
          <Text style={styles.deliveryHint}>Select delivery time</Text>
          <Text style={styles.deliveryHours}>{effectiveDeliveryHours}h</Text>
        </View>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel="Delivery time in hours"
          accessibilityValue={{ min: minDeliveryHours, max: 72, now: effectiveDeliveryHours, text: `${effectiveDeliveryHours} hours` }}
          onLayout={(event: LayoutChangeEvent) => setSliderWidth(event.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => items.length > 0 && minDeliveryHours < 72}
          onMoveShouldSetResponder={() => items.length > 0 && minDeliveryHours < 72}
          onResponderGrant={updateSliderValue}
          onResponderMove={updateSliderValue}
          style={[styles.sliderTouchArea, (items.length === 0 || minDeliveryHours >= 72) && styles.sliderDisabled]}>
          <View pointerEvents="none" style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${((effectiveDeliveryHours - minDeliveryHours) / (72 - minDeliveryHours || 1)) * 100}%` }]} />
            <View style={[styles.sliderThumb, { left: `${((effectiveDeliveryHours - minDeliveryHours) / (72 - minDeliveryHours || 1)) * 100}%` }]} />
          </View>
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>{minDeliveryHours}h</Text>
          <Text style={styles.sliderLabel}>36h</Text>
          <Text style={styles.sliderLabel}>72h</Text>
        </View>
        {minDeliveryHours > 6 ? <Text style={styles.minimumNote}>Minimum {minDeliveryHours}h based on items in cart</Text> : null}
        <View style={styles.speedCard}>
          <Text style={styles.speedCaption}>Delivery Speed</Text>
          <Text style={styles.speedName}>{getDeliveryLabel(effectiveDeliveryHours, pricePoints)}</Text>
          <Text style={styles.speedHours}>{effectiveDeliveryHours} hour{effectiveDeliveryHours !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={styles.totalEstimate}>Estimated total at {multiplier.toFixed(2)}×: KSh {finalTotal.toLocaleString('en-KE')}</Text>
      </View>
      <SectionTitle>Schedule</SectionTitle>
      <View style={styles.scheduleOptions}>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: scheduleOption === 'now' }}
          onPress={() => setScheduleOption('now')}
          style={[styles.scheduleOption, scheduleOption === 'now' && styles.scheduleOptionActive]}>
          <Text style={[styles.scheduleOptionText, scheduleOption === 'now' && styles.scheduleOptionTextActive]}>BOOK NOW</Text>
        </Pressable>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: scheduleOption === 'scheduled' }}
          onPress={openSchedulePicker}
          style={[styles.scheduleOption, scheduleOption === 'scheduled' && styles.scheduleOptionActive]}>
          <Text style={[styles.scheduleOptionText, scheduleOption === 'scheduled' && styles.scheduleOptionTextActive]}>SCHEDULE</Text>
        </Pressable>
      </View>
      {scheduleOption === 'scheduled' && schedule ? (
        <Pressable accessibilityRole="button" onPress={openSchedulePicker} style={styles.selectedSchedule}>
          <Text style={styles.selectedScheduleText}>Pickup: {new Intl.DateTimeFormat('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(schedule))}</Text>
          <Text style={styles.changeSchedule}>Change</Text>
        </Pressable>
      ) : null}
      <Field label="Note for the rider" value={note} onChangeText={setNote} placeholder="Optional pickup instructions" multiline />
      <SectionTitle>Dropoff</SectionTitle>
      <ActionButton title={sameAddress ? 'Dropoff: same as pickup' : 'Dropoff: different address'} secondary onPress={() => setSameAddress((value) => !value)} />
      {!sameAddress ? <Field label="Dropoff address" value={dropoff} onChangeText={setDropoff} placeholder="Home or office address" multiline /> : null}
      <SectionTitle>Your services</SectionTitle>
      {items.map(({ service, quantity }) => <Text key={service.id} style={{ paddingVertical: 7, color: colors.textSecondary }}>{service.name} × {quantity}  ·  KSh {(Number(service.price) * quantity).toLocaleString('en-KE')}</Text>)}
      {!items.length ? <Notice>Your cart is empty. Add a service before booking.</Notice> : null}
      {error ? <Notice error>{error}</Notice> : null}
      <ActionButton title="Confirm pickup" onPress={submit} loading={loading} disabled={!items.length} />

      <Modal visible={schedulePickerOpen} transparent animationType="fade" onRequestClose={closeSchedulePicker}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close calendar" onPress={closeSchedulePicker} style={styles.modalBackdrop} />
          <View style={styles.calendarCard}>
            <Text style={styles.calendarTitle}>Schedule pickup</Text>
            <View style={styles.monthHeader}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} style={styles.monthArrow}>
                <Text style={styles.monthArrowText}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>{new Intl.DateTimeFormat('en-KE', { month: 'long', year: 'numeric' }).format(calendarMonth)}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} style={styles.monthArrow}>
                <Text style={styles.monthArrowText}>›</Text>
              </Pressable>
            </View>
            <View style={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
              {getCalendarCells(calendarMonth).map((day, index) => {
                const selected = day !== null && draftDate.getFullYear() === calendarMonth.getFullYear() && draftDate.getMonth() === calendarMonth.getMonth() && draftDate.getDate() === day;
                return day === null
                  ? <View key={`blank-${index}`} style={styles.calendarDay} />
                  : <Pressable key={`day-${day}`} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setDraftDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day))} style={[styles.calendarDay, selected && styles.calendarDaySelected]}>
                    <Text style={[styles.calendarDayText, selected && styles.calendarDayTextSelected]}>{day}</Text>
                  </Pressable>;
              })}
            </View>
            <Text style={styles.timeLabel}>Pickup time</Text>
            <TextInput
              accessibilityLabel="Pickup time in 24-hour format"
              value={draftTime}
              onChangeText={(value) => {
                setDraftTime(value);
                setSchedulePickerError('');
              }}
              placeholder="10:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              style={styles.timeInput}
            />
            {schedulePickerError ? <Text style={styles.calendarError}>{schedulePickerError}</Text> : null}
            <View style={styles.calendarActions}>
              <Pressable accessibilityRole="button" onPress={closeSchedulePicker} style={styles.cancelButton}><Text style={styles.cancelButtonText}>Cancel</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={confirmSchedule} style={styles.confirmButton}><Text style={styles.confirmButtonText}>Confirm schedule</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </CustomerScreen>
  );
}

function calculatePriceMultiplier(hours: number, points: { hours: number; multiplier: number }[]) {
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    if (hours >= current.hours && hours <= next.hours) {
      const ratio = (hours - current.hours) / (next.hours - current.hours);
      return current.multiplier + (next.multiplier - current.multiplier) * ratio;
    }
  }
  return Math.max(points[points.length - 1].multiplier, 1);
}

function getDeliveryLabel(hours: number, points: { hours: number; multiplier: number }[]) {
  const multiplier = calculatePriceMultiplier(hours, points);
  if (multiplier >= 2) return 'Express';
  if (multiplier >= 1.5) return 'Fast';
  if (multiplier > 1) return 'Normal';
  if (hours >= 48) return 'Economy';
  return 'Standard';
}

function getCalendarCells(month: Date): (number | null)[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: dayCount }, (_, index) => index + 1),
  ];
  while (cells.length < 42) cells.push(null);
  return cells;
}

function createStyles(colors: (typeof Colors)[keyof typeof Colors]) {
  return StyleSheet.create({
    deliveryBlock: { marginTop: 10 },
    deliveryHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    deliveryHint: { color: colors.muted, fontSize: 12 },
    deliveryHours: { color: colors.primary, fontSize: 19, fontWeight: '900' },
    sliderTouchArea: { height: 42, justifyContent: 'center', paddingHorizontal: 11 },
    sliderDisabled: { opacity: 0.5 },
    sliderTrack: { height: 6, borderRadius: 99, backgroundColor: colors.border },
    sliderFill: { height: 6, borderRadius: 99, backgroundColor: colors.primary },
    sliderThumb: { position: 'absolute', top: -8, width: 22, height: 22, marginLeft: -11, borderWidth: 3, borderColor: colors.primary, borderRadius: 99, backgroundColor: colors.backgroundElement, elevation: 2 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 },
    sliderLabel: { color: colors.muted, fontSize: 11 },
    minimumNote: { marginTop: 5, color: colors.textSecondary, fontSize: 11 },
    speedCard: { marginTop: 14, padding: 13, borderRadius: 8, backgroundColor: colors.surface },
    speedCaption: { color: colors.muted, fontSize: 11 },
    speedName: { marginTop: 4, color: colors.text, fontSize: 15, fontWeight: '800' },
    speedHours: { marginTop: 3, color: colors.muted, fontSize: 11 },
    totalEstimate: { marginTop: 8, color: colors.muted, fontSize: 12 },
    scheduleOptions: { flexDirection: 'row', marginTop: 10, padding: 3, borderRadius: 10, backgroundColor: colors.chip },
    scheduleOption: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    scheduleOptionActive: { backgroundColor: colors.primary },
    scheduleOptionText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
    scheduleOptionTextActive: { color: '#FFFFFF' },
    selectedSchedule: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.backgroundElement },
    selectedScheduleText: { flex: 1, color: colors.text, fontSize: 12 },
    changeSchedule: { marginLeft: 10, color: colors.primary, fontSize: 12, fontWeight: '800' },
    modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    calendarCard: { width: '100%', maxWidth: 390, padding: 20, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.backgroundElement, elevation: 16 },
    calendarTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
    monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 9 },
    monthArrow: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.chip },
    monthArrowText: { color: colors.text, fontSize: 26, lineHeight: 30 },
    monthTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    weekday: { width: '14.2857%', height: 32, textAlign: 'center', textAlignVertical: 'center', color: colors.muted, fontSize: 12, fontWeight: '700' },
    calendarDay: { width: '14.2857%', height: 40, alignItems: 'center', justifyContent: 'center' },
    calendarDaySelected: { borderRadius: 20, backgroundColor: colors.primary },
    calendarDayText: { color: colors.text, fontSize: 13 },
    calendarDayTextSelected: { color: '#FFFFFF', fontWeight: '800' },
    timeLabel: { marginTop: 12, marginBottom: 6, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
    timeInput: { height: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, color: colors.text, fontSize: 15 },
    calendarError: { marginTop: 6, color: '#DC2626', fontSize: 11 },
    calendarActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
    cancelButton: { minHeight: 42, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.chip },
    cancelButtonText: { color: colors.text, fontSize: 12, fontWeight: '700' },
    confirmButton: { minHeight: 42, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.primary },
    confirmButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  });
}