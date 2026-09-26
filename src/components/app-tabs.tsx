import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAppTheme } from '@/contexts/theme-context';

export default function AppTabs() {
  const { colors } = useAppTheme();

  return (
    <NativeTabs
      backgroundColor={colors.tab}
      indicatorColor={colors.backgroundSelected}
      labelStyle={{ selected: { color: colors.primary }, default: { color: colors.tabInactive } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="login">
        <NativeTabs.Trigger.Label>Sign In</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.badge.checkmark" md="login" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
