import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppHeader from '@/components/app-header';
import BottomNav from '@/components/bottom-nav';
import WhatsAppButton from '@/components/whatsapp-button';
import { CartProvider } from '@/contexts/cart-context';
import { ThemePreferenceProvider, useAppTheme } from '@/contexts/theme-context';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { colorScheme } = useAppTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
    <AppHeader />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF' } }} />
      <BottomNav />
    <WhatsAppButton />
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <ThemePreferenceProvider>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </ThemePreferenceProvider>
  );
}
