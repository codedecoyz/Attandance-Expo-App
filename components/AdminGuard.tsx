import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    if (userRole !== 'admin') {
      console.log('User is not admin:', userRole);
      if (userRole === 'student') router.replace('/(student)/(tabs)/dashboard');
      else if (userRole === 'faculty') router.replace('/(faculty)/(tabs)/dashboard');
      else router.replace('/(auth)/login');
    }
  }, [user, userRole, loading]);

  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return userRole === 'admin' ? <>{children}</> : null;
}
