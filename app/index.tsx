import React, { useEffect } from 'react';
import { View, Text, StyleSheet,Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

export default function IndexScreen() {
  const { isAuthenticated, hasSeenOnboarding, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!hasSeenOnboarding) {
        // User hasn't seen onboarding, show it
        router.replace('/onboarding');
      } else if (!isAuthenticated) {
        // User has seen onboarding but isn't logged in, show login
        router.replace('/login');
      } else {
        // User is authenticated, show main app
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, hasSeenOnboarding, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/loomawhite.png')}
            style={styles.loomaLogo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>LoomaLearn</Text>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>L</Text>
        </View>
        <Text style={styles.appName}>LoomaLearn</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loomaLogo: {
    width: 100,
    height: 100,
    
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.base,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
});