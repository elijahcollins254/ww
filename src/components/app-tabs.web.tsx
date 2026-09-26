import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="login" href="/login" asChild>
            <TabButton>Sign In</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const { colors } = useAppTheme();
  const isHome = children === 'Home';

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <SymbolView
        tintColor={isFocused ? colors.primary : colors.tabInactive}
        name={isHome
          ? { ios: 'house', android: 'home', web: 'home' }
          : { ios: 'rectangle.portrait.and.arrow.right', android: 'login', web: 'login' }}
        size={22}
      />
      <Text style={[styles.tabLabel, { color: isFocused ? colors.primary : colors.tabInactive }]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const { colors } = useAppTheme();

  return (
    <View {...props} style={[styles.tabListContainer, { backgroundColor: colors.tab, borderTopColor: colors.border }]}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    flexDirection: 'row',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
