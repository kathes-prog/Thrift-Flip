/**
 * Shared: root stack. One ProjectProvider wraps every screen so the whole
 * flow shares one active project.
 */
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProjectProvider } from '@/state/ProjectContext';
import { colors, fontAssets } from '@/theme';

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
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { fontFamily: 'Manrope_600SemiBold' },
              headerTintColor: colors.primary,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Thrift Flip Studio' }} />
            <Stack.Screen name="new-garment" options={{ title: 'New Garment' }} />
            <Stack.Screen name="garment-map" options={{ title: 'Garment Map' }} />
            <Stack.Screen name="start" options={{ title: 'Start Designing' }} />
            <Stack.Screen name="patterns" options={{ title: 'Pattern Library' }} />
            <Stack.Screen name="studio" options={{ title: 'Design Studio' }} />
            <Stack.Screen name="cutting-plan" options={{ title: 'Cutting Plan' }} />
            <Stack.Screen name="dev/styles" options={{ title: 'Hello Styles' }} />
            <Stack.Screen name="dev/fixtures" options={{ title: 'Dev fixtures' }} />
          </Stack>
        </ProjectProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
