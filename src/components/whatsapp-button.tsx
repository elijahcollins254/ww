import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

const whatsappUrl = 'https://wa.me/254705415948?text=Hi%20Wild%20Wash%20I%20need%20assistance%20with%20my%20order';

export default function WhatsAppButton() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [opening, setOpening] = useState(false);
  const desktopWeb = Platform.OS === 'web' && width >= 768;

  const openWhatsApp = async () => {
    if (opening) return;
    setOpening(true);
    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      Alert.alert('Unable to open WhatsApp', 'Please try again or use the Contact page.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Chat with Wild Wash on WhatsApp"
      accessibilityHint="Opens WhatsApp to message customer support"
      onPress={() => void openWhatsApp()}
      style={({ pressed }) => [
        styles.button,
        {
          bottom: desktopWeb ? 20 : 12,
          right: Math.max(insets.right, 12) + 16,
        },
        pressed && styles.pressed,
        opening && styles.opening,
      ]}>
      <FontAwesome name="whatsapp" size={23} color="#FFFFFF" />
      {/* <Text style={styles.label}>WhatsApp</Text> */}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    zIndex: 1001,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
    borderRadius: 28,
    backgroundColor: '#25D366',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 6,
  },
  label: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
  opening: { opacity: 0.7 },
});
