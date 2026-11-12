import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Location from 'expo-location';

import { Notice } from '@/components/customer-ui';
import PickupMap from '@/components/pickup-map';
import { useAppTheme } from '@/contexts/theme-context';

type PickupLocationPickerProps = {
  position: [number, number] | null;
  onChange: (position: [number, number] | null) => void;
};

const DEFAULT_POSITION: [number, number] = [-1.286389, 36.817223];

export default function PickupLocationPicker({ position, onChange }: PickupLocationPickerProps) {
  const { colors } = useAppTheme();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const locateCurrentLocation = async () => {
    setLocating(true);
    setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Location permission was not granted. You can still select a point on the map.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      onChange([location.coords.latitude, location.coords.longitude]);
    } catch (locationError) {
      setError(locationError instanceof Error ? locationError.message : 'Unable to read your current location.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ marginBottom: 8, color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Pin exact pickup location</Text>
      <View style={{ overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
        <PickupMap position={position ?? DEFAULT_POSITION} hasPin={position !== null} onChange={(nextPosition) => onChange(nextPosition)} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <Pressable
          accessibilityRole="button"
          disabled={locating}
          onPress={() => void locateCurrentLocation()}
          style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 6, backgroundColor: colors.primary, opacity: locating ? 0.6 : 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>{locating ? 'Finding location…' : 'Use my location'}</Text>
        </Pressable>
        {position ? (
          <Pressable accessibilityRole="button" onPress={() => onChange(null)} style={{ paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 6 }}>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>Clear pin</Text>
          </Pressable>
        ) : null}
      </View>
      {position ? (
        <Text style={{ marginTop: 8, color: colors.muted, fontSize: 11 }}>
          {position[0].toFixed(6)}, {position[1].toFixed(6)} · Tap the map or drag the pin to adjust.
        </Text>
      ) : (
        <Text style={{ marginTop: 8, color: colors.muted, fontSize: 11 }}>Tap the map, use your current location, or leave the pickup pin unset.</Text>
      )}
      {error ? <Notice error>{error}</Notice> : null}
    </View>
  );
}
