import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COMMON } from '../constants/theme';

export function StatusFilterBar({ statuses = [], selectedStatusId = null, onSelectStatus, theme }) {
  const allFilters = [
    { id: null, status_label: 'All Tasks' },
    ...statuses,
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {allFilters.map((item) => {
          const isSelected = selectedStatusId === item.id;
          return (
            <TouchableOpacity
              key={item.id === null ? 'all' : `status-${item.id}`}
              style={[
                styles.chip,
                isSelected
                  ? { backgroundColor: theme.primary, borderColor: theme.primaryLight }
                  : { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
              ]}
              onPress={() => onSelectStatus(item.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#ffffff' : theme.textSecondary },
                ]}
              >
                {item.status_label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: COMMON.spacing.sm,
  },
  scrollContainer: {
    paddingHorizontal: COMMON.spacing.lg,
    gap: COMMON.spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: COMMON.borderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
