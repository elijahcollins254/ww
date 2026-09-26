import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 780;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      opacity: 0,
      transform: [{ scale: 0.7 }, { rotate: '-10deg' }],
      easing: Easing.out(Easing.cubic),
    },
    26: {
      opacity: 1,
      transform: [{ scale: 1.14 }, { rotate: '4deg' }],
      easing: Easing.out(Easing.cubic),
    },
    52: {
      opacity: 1,
      transform: [{ scale: 0.98 }, { rotate: '-1deg' }],
      easing: Easing.inOut(Easing.quad),
    },
    76: {
      opacity: 1,
      transform: [{ scale: 1.04 }, { rotate: '0deg' }],
      easing: Easing.inOut(Easing.quad),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1.08 }, { rotate: '0deg' }],
      easing: Easing.in(Easing.cubic),
    },
  });

  const image = (
    <View style={styles.logoWrap}>
      <Image
        style={styles.image}
        source={require('@/assets/images/ww logo.png')}
        contentFit="contain"
      />
    </View>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {image}
    </View>
  );
}

export function AnimatedIcon() {
  return <Image style={styles.image} source={require('@/assets/images/ww logo.png')} contentFit="contain" />;
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    backgroundColor: 'transparent',
  },
  image: {
    width: 200,
    height: 200,
    shadowColor: '#E10613',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
