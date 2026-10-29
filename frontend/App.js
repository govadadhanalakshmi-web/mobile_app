import React, { useState, useMemo, useCallback } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { THEMES } from './src/constants/theme';
import { GoogleTasksScreen } from './src/screens/GoogleTasksScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';

function MainNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'register'

  // Theme state
  const [isDark, setIsDark] = useState(false);
  const theme = useMemo(() => (isDark ? THEMES.dark : THEMES.light), [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      {isAuthenticated ? (
        <GoogleTasksScreen
          isDark={isDark}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
      ) : currentScreen === 'register' ? (
        <RegisterScreen
          onNavigateLogin={() => setCurrentScreen('login')}
          theme={theme}
        />
      ) : (
        <LoginScreen
          onNavigateRegister={() => setCurrentScreen('register')}
          theme={theme}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
