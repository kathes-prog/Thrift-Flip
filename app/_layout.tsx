/**
 * Shared: root stack. One ProjectProvider wraps every screen so the whole
 * flow shares one active project.
 *
 * Zine look: screens draw their own big cut-out titles, so the native header
 * only carries the back chevron on photocopy paper.
 */
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ZineAlertProvider } from '@/components/zine/ZineAlert';
import { ProjectProvider } from '@/state/ProjectContext';
import { colors, fontAssets, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProjectProvider>
          <ZineAlertProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                // Transparent so the speckled paper runs behind the back button with no seam.
                headerTransparent: true,
                headerShadowVisible: false,
                headerTitle: '',
                headerTitleStyle: { fontFamily: fonts.display },
                headerBackButtonDisplayMode: 'minimal',
                headerTintColor: colors.ink,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="new-garment" />
              <Stack.Screen name="garment-map" />
              <Stack.Screen name="start" />
              <Stack.Screen name="patterns" />
              <Stack.Screen name="studio" />
              <Stack.Screen name="cutting-plan" />
              <Stack.Screen name="dev/styles" />
              <Stack.Screen name="dev/fixtures" />
            </Stack>
          </ZineAlertProvider>
        </ProjectProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
