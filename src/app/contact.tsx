import { useState } from 'react';
import { Linking, Pressable, Text } from 'react-native';

import { ActionButton, CustomerScreen, Field, Notice, SectionTitle } from '@/components/customer-ui';
import { FeatureCard } from '@/components/feature-ui';
import { useAppTheme } from '@/contexts/theme-context';

const supportPhone = '+254700000000';
const whatsappPhone = '254705415948';
const supportEmail = 'hello@wildwash.co';

export default function ContactScreen() {
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const open = async (url: string) => {
    try { await Linking.openURL(url); } catch { setError('Unable to open this contact method on your device.'); }
  };
  const compose = async () => {
    setError(''); setNotice('');
    if (!name.trim() || !message.trim()) { setError('Enter your name and message before contacting support.'); return; }
    const subject = encodeURIComponent(`Wild Wash support request from ${name.trim()}`);
    const body = encodeURIComponent(`${message.trim()}\n\nName: ${name.trim()}\nEmail: ${email.trim() || 'Not provided'}\nPhone: ${phone.trim() || 'Not provided'}`);
    try { await Linking.openURL(`mailto:${supportEmail}?subject=${subject}&body=${body}`); setNotice('Your email app has been opened with your message. Send it there to contact support.'); }
    catch { setError('No email app is available. Please email hello@wildwash.co or contact us by phone.'); }
  };
  return (
    <CustomerScreen title="Contact Wild Wash" subtitle="Reach customer support or prepare a message for our team.">
      <FeatureCard>
        <SectionTitle>Customer support</SectionTitle>
        <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13 }}>Phone: {supportPhone}</Text>
        <ActionButton title="Call support" secondary onPress={() => void open(`tel:${supportPhone}`)} />
        <ActionButton title="Message on WhatsApp" secondary onPress={() => void open(`https://wa.me/${whatsappPhone}?text=Hi%20Wild%20Wash`)} />
        <ActionButton title="Email support" secondary onPress={() => void open(`mailto:${supportEmail}`)} />
        <Text style={{ marginTop: 12, color: colors.muted, fontSize: 12 }}>Support hours: Mon–Sat 07:00–19:00, Sun 08:00–14:00 · Westlands, Nairobi (by appointment)</Text>
      </FeatureCard>
      <SectionTitle>Send a message</SectionTitle>
      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>Messages are sent using your device's email app. The website's contact form has no message API endpoint configured.</Text>
      <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
      <Field label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
      <Field label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0712345678" />
      <Field label="Message" value={message} onChangeText={setMessage} multiline placeholder="How can we help?" />
      {error ? <Notice error>{error}</Notice> : null}{notice ? <Notice>{notice}</Notice> : null}
      <ActionButton title="Continue to email" onPress={compose} />
      <Pressable onPress={() => void open('https://wa.me/254705415948?text=Hi%20Wild%20Wash')} style={{ marginTop: 16, alignItems: 'center' }}><Text style={{ color: colors.primary, fontWeight: '800' }}>For urgent or lost-item cases, message us on WhatsApp</Text></Pressable>
    </CustomerScreen>
  );
}
