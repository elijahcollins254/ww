import { Text } from 'react-native';

import { CustomerScreen, SectionTitle } from '@/components/customer-ui';
import { FeatureCard } from '@/components/feature-ui';
import { useAppTheme } from '@/contexts/theme-context';

const sections: Array<[string, string]> = [
  ['Eligibility', 'Applicants must be at least 18 years old, have a verified Wild Wash account, provide accurate contact information, and meet the eligibility checks for the selected loan product. An order-backed application also requires an eligible order.'],
  ['Loan types and collateral', 'Order-backed applications use a selected order as collateral. Collateral-only applications may include property, vehicles, equipment, electronics, jewelry, or other assets. Collateral details and values are subject to verification.'],
  ['Amounts and term', 'The app calculates an indicative maximum of 60% of the entered order or collateral value. Final limits are subject to review. Application durations are between 1 and 365 days.'],
  ['Interest and repayment', 'The current application estimate uses simple interest at 2% per day: principal × 0.02 × number of days. Your final repayment terms are confirmed during review. Confirm the amount, rate, fees, repayment schedule, and due date before accepting a loan offer.'],
  ['Guarantors', 'At least one guarantor is required. Provide their accurate name, phone, email, and relationship details, and ensure they have agreed to be contacted about the application.'],
  ['Review and status', 'Applications are subject to review and may be approved or declined. Submission does not guarantee approval or funding. Track status and any final terms in My Loans.'],
  ['Privacy and support', 'Application data is used to assess and administer the loan request. For questions or corrections, contact Wild Wash support through the Contact screen.'],
];

export default function LoanTermsScreen() {
  const { colors } = useAppTheme();
  return (
    <CustomerScreen title="Loan terms" subtitle="Review the key information before you submit an application.">
      <FeatureCard><Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>Important</Text><Text style={{ marginTop: 7, color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>These are a summary of the application rules, not a loan offer. Confirm the exact written terms presented for an approved loan before accepting or receiving funds.</Text></FeatureCard>
      {sections.map(([title, copy], index) => <FeatureCard key={title}><SectionTitle>{`${index + 1}. ${title}`}</SectionTitle><Text style={{ marginTop: 5, color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{copy}</Text></FeatureCard>)}
    </CustomerScreen>
  );
}
