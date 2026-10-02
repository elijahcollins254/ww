import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

export function AnimatedSplashOverlay() {
  return null;
}

export function AnimatedIcon() {
  return <Image style={styles.image} source={require('@/assets/images/ww logo.png')} contentFit="contain" />;
}

const styles = StyleSheet.create({
  image: { width: 128, height: 128 },
});
