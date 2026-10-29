import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COMMON } from '../constants/theme';

export function Header({
  totalCount = 0,
  completedCount = 0,
  onRefresh,
  isRefreshing = false,
  theme,
  isDark = true,
  onToggleTheme,
}) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.dateText, { color: theme.textMuted }]}>{today.toUpperCase()}</Text>
        <Text style={[styles.titleText, { color: theme.textPrimary }]}>Tasks & Priorities</Text>
      </View>

      <View style={styles.rightContainer}>
        {/* Theme Toggle Button */}
        <TouchableOpacity
          onPress={onToggleTheme}
          style={[
            styles.iconButton,
            { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>

        {/* Counter Badge */}
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
          ]}
        >
          <Text style={[styles.badgeText, { color: theme.primaryLight }]}>
            {completedCount}/{totalCount} Done
          </Text>
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={onRefresh}
          disabled={isRefreshing}
          style={[
            styles.iconButton,
            { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>{isRefreshing ? '⌛' : '🔄'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: COMMON.spacing.lg,
    paddingTop: COMMON.spacing.md,
    paddingBottom: COMMON.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: COMMON.spacing.sm,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: COMMON.borderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    borderWidth: 1,
    width: 36,
    height: 36,
    borderRadius: COMMON.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
});
