import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

export function WebBadge() {
  return (
    <Image source={require('@/assets/images/ww logo.png')} style={styles.logo} contentFit="contain" />
  );
}

const styles = StyleSheet.create({
  logo: { width: 72, height: 72 },
});
