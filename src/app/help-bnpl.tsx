import { Text, View } from 'react-native';

import { CustomerScreen, SectionTitle } from '@/components/customer-ui';
import { FeatureCard } from '@/components/feature-ui';
import { useAppTheme } from '@/contexts/theme-context';

const questions = [
  ['How do I enroll?', 'Sign in, open Buy now, pay later, and enroll with the phone number that receives your M-PESA prompts. Enrollment and credit are subject to account eligibility.'],
  ['How are payments split?', 'Eligible BNPL purchases can be split into an upfront payment and a later balance according to the payment terms shown during checkout. Check your account for the current balance and due information.'],
  ['Can I pay early?', 'You can initiate a payment against your outstanding balance from the BNPL screen. The M-PESA prompt must be completed before the balance updates.'],
  ['What if a payment is missed?', 'An account with an overdue or outstanding balance may be restricted from further BNPL use. Contact support if a payment status does not update.'],
  ['How do I opt out?', 'Opt out from the BNPL account screen once your outstanding balance is cleared.'],
];

export default function BNPLHelpScreen() {
  const { colors } = useAppTheme();
  return (
    <CustomerScreen title="BNPL help" subtitle="A quick guide to Buy Now, Pay Later account management.">
      <FeatureCard><Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>How it works</Text><Text style={{ marginTop: 9, color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>When BNPL is available for your account, payment terms are presented during checkout. Review the required upfront amount, balance, and due date before confirming. Manage enrollment and repayments in the BNPL account page.</Text></FeatureCard>
      <SectionTitle>Frequently asked questions</SectionTitle>
      {questions.map(([title, answer]) => <FeatureCard key={title}><Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{title}</Text><Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{answer}</Text></FeatureCard>)}
      <View style={{ height: 10 }} />
      <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>Your account screen and checkout show the terms currently available to you. If terms differ from this general guide, follow the terms shown for your transaction.</Text>
    </CustomerScreen>
  );
}
