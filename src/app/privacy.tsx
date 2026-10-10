import { Text, View } from 'react-native';

import { CustomerScreen, SectionTitle } from '@/components/customer-ui';
import { useAppTheme } from '@/contexts/theme-context';

const sections: Array<[string, string, string[]?]> = [
  ['Information we collect', 'The information we collect depends on how you use Wild Wash. It may include information you provide, information created when you use our services, and limited technical information sent when your device connects to our systems.', [
    'Account and contact details, including username, name, phone number, email address, password credentials, and service location.',
    'Pickup and service details, including an address or coordinates you choose to provide, order history, selected services, item descriptions, quantities, weights, notes, and delivery preferences.',
    'Payment details such as amount, status, phone number used to start payment, and transaction references. Your M-Pesa PIN is entered with the payment provider and is not requested by Wild Wash in the app.',
    'Trade-in descriptions and estimated values, contact phone number, and preferences for optional subscriptions or offer messages.',
    'If you choose Google sign-in, profile details returned for authentication, such as name, email address, and Google account identifier.',
    'Technical request information that may be available to service providers, such as IP address, request time, and device, operating system, or app information used for security and troubleshooting.',
  ]],
  ['How we use information', 'We use information to create and secure accounts; provide pickups, cleaning, delivery, order tracking, and support; process payments; administer trade-ins; send service, payment, and account messages; manage subscriptions and optional offer messages; prevent misuse; resolve disputes; meet legal obligations; and maintain and improve our services.'],
  ['How information is shared', 'We do not sell personal information. We share it only as needed for the purposes in this policy, including with:', [
    'Wild Wash personnel, service providers, and assigned pickup or delivery personnel who need information to provide a requested service.',
    'Payment providers, including M-Pesa/Safaricom where applicable, to initiate and confirm payments. Their own privacy terms apply to information they collect directly.',
    'Google when you choose Google sign-in.',
    'Hosting, infrastructure, communications, and support providers that help operate our app, website, API, or SMS and email communications.',
    'Authorities or other parties when required by law, to protect people and property, or to establish, exercise, or defend legal claims. Information may also be involved in a business transfer, subject to applicable law.',
  ]],
  ['Storage, security, and retention', 'Wild Wash and its service providers process account and service information. We use reasonable administrative and technical safeguards appropriate to the information we handle, but no internet transmission or storage system can be guaranteed completely secure. We keep information for as long as needed to provide services, maintain accounts and transaction history, resolve issues, and meet legal, accounting, and safety obligations. You can request account deletion using the contact details below; some records may need to be retained where the law requires or permits it.'],
  ['Your choices and rights', 'You can update many profile details in the app, opt out of optional offer messages through your profile, and contact us to request access to, correction of, or deletion of your information or raise a privacy concern. Rights and exceptions depend on applicable law. You may also complain to the Office of the Data Protection Commissioner in Kenya. Necessary service, security, and transaction messages may continue if you opt out of optional messages.'],
  ['Children', 'The app is not designed for children under 13, and we do not knowingly collect their personal information. Contact us if you believe a child has provided information to Wild Wash.'],
  ['Third-party services and changes', 'Google sign-in, payment services, and links opened outside the app are operated by their respective providers and are subject to their own privacy policies. We may update this policy when our practices or legal requirements change. The latest version will be posted on the Wild Wash privacy policy webpage.'],
  ['Contact us', 'For privacy questions or requests, email hello@wildwash.co. Please do not include passwords, M-Pesa PINs, or other payment credentials in your message.'],
];

export default function PrivacyScreen() {
  const { colors } = useAppTheme();

  return (
    <CustomerScreen title="Privacy Policy" subtitle="Last updated: October 4, 2026. This policy explains how Wild Wash handles personal information when you use the app, website, and related services.">
      {sections.map(([title, copy, bullets], index) => (
        <View key={title} style={{ paddingBottom: 16, borderBottomWidth: index === sections.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
          <SectionTitle>{title}</SectionTitle>
          <Text style={{ marginTop: 5, color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{copy}</Text>
          {bullets?.map((bullet) => <Text key={bullet} style={{ marginTop: 8, marginLeft: 8, color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>• {bullet}</Text>)}
        </View>
      ))}
    </CustomerScreen>
  );
}