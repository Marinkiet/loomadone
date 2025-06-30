import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/hooks/useAuth';
import { SubjectsProvider } from '@/hooks/useSubjects';
import { LeaderboardProvider } from '@/hooks/useLeaderboard';
import { StatsProvider } from '@/hooks/useStats';
import { TimetableProvider } from '@/hooks/useTimetable';
import { TavusProvider } from '@/hooks/useTavus';
import { GameProvider } from '@/hooks/useGameQuestions';
import { StripeProvider } from '@/hooks/useStripe';
import { ElevenLabsProvider } from '@/hooks/useElevenLabs';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <SubjectsProvider>
        <LeaderboardProvider>
          <StatsProvider>
            <TimetableProvider>
              <TavusProvider>
                <GameProvider>
                  <StripeProvider>
                    <ElevenLabsProvider>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="login" options={{ headerShown: false }} />
                        <Stack.Screen name="password-reset" options={{ headerShown: false }} />
                        <Stack.Screen name="school-login" options={{ headerShown: false }} />
                        <Stack.Screen name="register" options={{ headerShown: false }} />
                        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
                        <Stack.Screen name="theme-test" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="game-map" options={{ headerShown: false }} />
                        <Stack.Screen name="game-cards" options={{ headerShown: false }} />
                        <Stack.Screen name="profile" options={{ headerShown: false }} />
                        <Stack.Screen name="+not-found" />
                      </Stack>
                      <StatusBar style="auto" />
                    </ElevenLabsProvider>
                  </StripeProvider>
                </GameProvider>
              </TavusProvider>
            </TimetableProvider>
          </StatsProvider>
        </LeaderboardProvider>
      </SubjectsProvider>
    </AuthProvider>
  );
}