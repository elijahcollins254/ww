import { Text } from 'react-native';
import { router } from 'expo-router';

import { ActionButton, CustomerScreen, SectionTitle } from '@/components/customer-ui';
import { FeatureCard, FeatureLink } from '@/components/feature-ui';
import { useAppTheme } from '@/contexts/theme-context';

export default function FinancingScreen() {
  const { colors } = useAppTheme();
  return (
    <CustomerScreen title="Payment options" subtitle="Choose how to pay for Wild Wash services and explore available customer programs.">
      <FeatureCard>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>M-PESA</Text>
        <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>Pay securely at checkout using an M-PESA prompt. Start by placing an order, then choose M-PESA on the checkout screen.</Text>
        <ActionButton title="Book a service" onPress={() => router.push('/')} />
      </FeatureCard>
      <SectionTitle>Flexible payment & customer programs</SectionTitle>
      <FeatureLink title="Buy now, pay later" subtitle="Manage enrollment, available credit, and repayments." href="/bnpl" />
      <FeatureLink title="Trade in" subtitle="Submit an appliance or equipment item for valuation." href="/tradein" />
      <FeatureLink title="Offers and discounts" subtitle="Browse current offers and claim eligible discounts." href="/offers" />
      <FeatureLink title="BNPL guide" subtitle="Read how installments and account eligibility work." href="/help-bnpl" />
    </CustomerScreen>
  );
}
