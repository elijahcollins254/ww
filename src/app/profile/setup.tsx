import { useEffect } from 'react';
import { router } from 'expo-router';

export default function ProfileSetupScreen() {
  useEffect(() => { router.replace('/profile'); }, []);
  return null;
}
