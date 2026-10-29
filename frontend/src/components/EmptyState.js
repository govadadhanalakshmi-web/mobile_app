import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COMMON, THEMES } from '../constants/theme';

export function EmptyState({
  message = 'No tasks found',
  subMessage = 'Create a new task to get started.',
  theme = THEMES.light,
}) {
  const currentTheme = theme || THEMES.light;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📋</Text>
      <Text style={[styles.title, { color: currentTheme.textPrimary }]}>{message}</Text>
      <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>{subMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: COMMON.spacing.xl * 2,
    paddingHorizontal: COMMON.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: COMMON.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
});
