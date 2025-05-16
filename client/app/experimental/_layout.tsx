// client/app/experimental/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { SimpleAuthProvider } from '../context/SimpleAuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../constants/theme';
import { Provider } from 'react-redux';
import store from '../store/store';

export default function ExperimentalLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider>
          <SimpleAuthProvider>
            <Stack>
              <Stack.Screen
                name="index"
                options={{
                  title: 'Expérimental',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="test-auth"
                options={{
                  title: 'Test Auth Simplifié',
                  headerShown: true,
                }}
              />
            </Stack>
          </SimpleAuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}