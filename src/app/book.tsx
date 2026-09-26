import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { ActionButton, CustomerScreen, Field, Notice, SectionTitle } from '@/components/customer-ui';
import { useCart } from '@/contexts/cart-context';
import { apiRequest } from '@/lib/api';
import { useAppTheme } from '@/contexts/theme-context';

export default function BookingScreen() {
  const { colors } = useAppTheme();
  const { items, subtotal, clearCart } = useCart();
  const [pickup, setPickup] = useState('');
  const [phone, setPhone] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [sameAddress, setSameAddress] = useState(true);
  const [note, setNote] = useState('');
  const [schedule, setSchedule] = useState('');
  const [hours, setHours] = useState('48');
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
  const deliveryHours = Math.min(72, Math.max(6, Number(hours) || 48));
  const pricePoints = [
    { hours: 6, multiplier: 2 }, { hours: 12, multiplier: 1.6 }, { hours: 24, multiplier: 1.3 },
    { hours: 36, multiplier: 1.1 }, { hours: 48, multiplier: 1 }, { hours: 72, multiplier: 1 },
  ];
  const pointIndex = pricePoints.findIndex((point, index) => index < pricePoints.length - 1 && deliveryHours >= point.hours && deliveryHours <= pricePoints[index + 1].hours);
  const point = pricePoints[Math.max(0, pointIndex)];
  const nextPoint = pricePoints[Math.min(pricePoints.length - 1, Math.max(0, pointIndex) + 1)];
  const ratio = (deliveryHours - point.hours) / (nextPoint.hours - point.hours || 1);
  const multiplier = pointIndex < 0 ? 1 : point.multiplier + (nextPoint.multiplier - point.multiplier) * ratio;
  const finalTotal = subtotal * multiplier;
  const submit = async () => {
    if (!items.length || !pickup.trim() || phone.replace(/\D/g, '').length < 10 || (!sameAddress && !dropoff.trim())) {
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
        urgency: multiplier >= 2 ? 3 : multiplier >= 1.3 ? 2 : 1,
        items: totalCount,
        price: Math.round(finalTotal * 100) / 100,
        estimated_delivery: new Date(Date.now() + deliveryHours * 3600000).toISOString(),
        ...(note.trim() ? { description: note.trim() } : {}),
        ...(schedule.trim() ? { requested_pickup_at: new Date(schedule).toISOString() } : {}),
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
      <Field label="Delivery speed in hours (6–72)" value={hours} onChangeText={setHours} keyboardType="number-pad" />
      <Text style={{ marginTop: 5, color: colors.muted, fontSize: 12 }}>Estimated total at {multiplier.toFixed(2)}×: KSh {finalTotal.toLocaleString('en-KE')}</Text>
      <Field label="Pickup schedule (optional, local time)" value={schedule} onChangeText={setSchedule} placeholder="2026-09-27T10:00" />
      <Field label="Note for the rider" value={note} onChangeText={setNote} placeholder="Optional pickup instructions" multiline />
      <SectionTitle>Dropoff</SectionTitle>
      <ActionButton title={sameAddress ? 'Dropoff: same as pickup' : 'Dropoff: different address'} secondary onPress={() => setSameAddress((value) => !value)} />
      {!sameAddress ? <Field label="Dropoff address" value={dropoff} onChangeText={setDropoff} placeholder="Home or office address" multiline /> : null}
      <SectionTitle>Your services</SectionTitle>
      {items.map(({ service, quantity }) => <Text key={service.id} style={{ paddingVertical: 7, color: colors.textSecondary }}>{service.name} × {quantity}  ·  KSh {(Number(service.price) * quantity).toLocaleString('en-KE')}</Text>)}
      {!items.length ? <Notice>Your cart is empty. Add a service before booking.</Notice> : null}
      {error ? <Notice error>{error}</Notice> : null}
      <ActionButton title="Confirm pickup" onPress={submit} loading={loading} disabled={!items.length} />
    </CustomerScreen>
  );
}