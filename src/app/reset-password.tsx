import { useState } from 'react';
import { router } from 'expo-router';
import { CustomerScreen, Field, ActionButton, Notice } from '@/components/customer-ui';
import { apiRequest } from '@/lib/api';

type Step = 'phone' | 'code' | 'password';

export default function ResetPasswordScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const run = async (path: string, body: Record<string, string>, next?: Step, onSuccess?: () => void) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await apiRequest<{ detail?: string }>(path, { method: 'POST', body: JSON.stringify(body) });
      if (next) setStep(next);
      setMessage(result.detail || 'Done.');
      onSuccess?.();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The request failed.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <CustomerScreen title="Reset password" subtitle={step === 'phone' ? 'Request a reset code by SMS.' : step === 'code' ? 'Enter the four-digit code sent to your phone.' : 'Choose a new password for your account.'}>
      {step === 'phone' ? <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0712345678" /> : null}
      {step !== 'phone' ? <Field label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /> : null}
      {step !== 'phone' ? <Field label="Verification code" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} placeholder="0000" /> : null}
      {step === 'password' ? <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" /> : null}
      {error ? <Notice error>{error}</Notice> : null}
      {message ? <Notice>{message}</Notice> : null}
      {step === 'phone' ? <ActionButton title="Send reset code" onPress={() => run('/users/password-reset/request/', { phone }, 'code')} loading={loading} /> : null}
      {step === 'code' ? <ActionButton title="Verify code" onPress={() => run('/users/password-reset/verify/', { phone, code }, 'password')} loading={loading} /> : null}
      {step === 'password' ? <ActionButton title="Save new password" onPress={() => run('/users/password-reset/confirm/', { phone, code, password }, undefined, () => router.replace('/login'))} loading={loading} /> : null}
      {step !== 'phone' ? <ActionButton title="Back" secondary onPress={() => setStep(step === 'password' ? 'code' : 'phone')} /> : null}
    </CustomerScreen>
  );
}