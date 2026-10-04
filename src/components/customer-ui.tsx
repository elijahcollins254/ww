import { useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export function CustomerScreen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPasswordField = props.secureTextEntry === true;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      {isPasswordField ? (
        <View style={[styles.input, styles.passwordInputWrap, props.style]}>
          <TextInput placeholderTextColor={colors.muted} {...props} secureTextEntry={!passwordVisible} style={styles.passwordInput} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            onPress={() => setPasswordVisible(!passwordVisible)}
            hitSlop={8}
            style={styles.passwordToggle}>
            <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
          </Pressable>
        </View>
      ) : (
        <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.multiline && styles.multiline, props.style]} />
      )}
    </View>
  );
}

export function ActionButton({ title, onPress, secondary = false, disabled = false, loading = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; loading?: boolean }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return (
    <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, pressed && styles.pressed, (disabled || loading) && styles.disabled]}>
      {loading ? <ActivityIndicator color={secondary ? colors.primary : '#FFFFFF'} /> : <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>}
    </Pressable>
  );
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return <View style={[styles.notice, error && styles.errorNotice]}><Text style={[styles.noticeText, error && styles.errorText]}>{children}</Text></View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function createStyles(colors: (typeof Colors)[keyof typeof Colors]) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    page: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },
    title: { marginTop: 28, color: colors.text, fontSize: 28, fontWeight: '900' },
    subtitle: { marginTop: 7, marginBottom: 20, color: colors.muted, fontSize: 13, lineHeight: 19 },
    fieldWrap: { marginTop: 14 },
    label: { marginBottom: 7, color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
    input: { minHeight: 48, paddingHorizontal: 13, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.backgroundElement, color: colors.text, fontSize: 14 },
    passwordInputWrap: { flexDirection: 'row', alignItems: 'center' },
    passwordInput: { flex: 1, minHeight: 46, paddingVertical: 10, color: colors.text, fontSize: 14 },
    passwordToggle: { width: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    multiline: { minHeight: 94, textAlignVertical: 'top' },
    button: { minHeight: 48, marginTop: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: colors.primary },
    buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    secondaryButton: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    secondaryButtonText: { color: colors.text },
    pressed: { opacity: 0.75 },
    disabled: { opacity: 0.55 },
    notice: { marginTop: 14, padding: 12, borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 5, backgroundColor: '#ECFDF5' },
    noticeText: { color: '#047857', fontSize: 13, lineHeight: 19 },
    errorNotice: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
    errorText: { color: '#B91C1C' },
    sectionTitle: { marginTop: 24, marginBottom: 4, color: colors.text, fontSize: 16, fontWeight: '800' },
  });
}