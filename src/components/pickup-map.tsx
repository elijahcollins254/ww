import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type MapPressEvent } from 'react-native-maps';

type PickupMapProps = {
  position: [number, number];
  hasPin: boolean;
  onChange: (position: [number, number]) => void;
};

const toCoordinate = ([latitude, longitude]: [number, number]) => ({ latitude, longitude });

export default function PickupMap({ position, hasPin, onChange }: PickupMapProps) {
  const map = useRef<MapView>(null);

  useEffect(() => {
    map.current?.animateToRegion({
      ...toCoordinate(position),
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    });
  }, [position]);

  const selectPosition = ({ nativeEvent }: MapPressEvent) => {
    onChange([nativeEvent.coordinate.latitude, nativeEvent.coordinate.longitude]);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={map}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          ...toCoordinate(position),
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        onPress={selectPosition}
        accessibilityLabel="Pickup location map">
        {hasPin ? (
          <Marker
            coordinate={toCoordinate(position)}
            draggable
            onDragEnd={({ nativeEvent }) => onChange([nativeEvent.coordinate.latitude, nativeEvent.coordinate.longitude])}
            title="Pickup location"
            description="Drag to adjust the exact pickup point"
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 260, width: '100%', overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFill },
});
