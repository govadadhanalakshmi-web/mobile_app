import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COMMON, STATUS_COLORS } from '../constants/theme';

export const TodoCard = React.memo(function TodoCard({
  item,
  onToggleStatus,
  onEdit,
  onDelete,
  theme,
}) {
  const isCompleted = item.status_code === 'completed';
  const statusConfig = STATUS_COLORS[item.status_code] || {
    bg: 'rgba(100, 116, 139, 0.15)',
    text: item.color_code || theme.textMuted,
    border: 'rgba(100, 116, 139, 0.35)',
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surfaceBorder,
          shadowColor: theme.cardShadow,
        },
      ]}
    >
      <View style={styles.topRow}>
        {/* Status Pill (Clickable to advance status) */}
        <TouchableOpacity
          style={[
            styles.statusPill,
            { backgroundColor: statusConfig.bg, borderColor: statusConfig.border },
          ]}
          onPress={() => onToggleStatus(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            ● {item.status_label || 'Status'}
          </Text>
        </TouchableOpacity>

        {/* Due Date Display if present */}
        {item.due_date ? (
          <Text style={[styles.dueDateText, { color: theme.textMuted }]}>
            📅 {item.due_date}
          </Text>
        ) : null}
      </View>

      {/* Main Title & Description */}
      <View style={styles.body}>
        <Text
          style={[
            styles.title,
            { color: theme.textPrimary },
            isCompleted && { textDecorationLine: 'line-through', color: theme.textMuted },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.description ? (
          <Text
            style={[
              styles.description,
              { color: theme.textSecondary },
              isCompleted && { color: theme.textMuted },
            ]}
            numberOfLines={3}
          >
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Card Actions Bottom Row */}
      <View
        style={[
          styles.bottomRow,
          { borderTopColor: theme.surfaceBorder },
        ]}
      >
        <Text style={[styles.dateMeta, { color: theme.textMuted }]}>
          Created: {item.created_at ? item.created_at.substring(0, 10) : ''}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.surfaceActive }]}
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionText, { color: theme.textPrimary }]}>✏️ Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.dangerBg }]}
            onPress={() => onDelete(item.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.deleteText, { color: theme.danger }]}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: COMMON.borderRadius.lg,
    padding: COMMON.spacing.md,
    marginHorizontal: COMMON.spacing.lg,
    marginVertical: COMMON.spacing.xs + 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: COMMON.spacing.sm,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: COMMON.borderRadius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  body: {
    marginBottom: COMMON.spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: COMMON.spacing.sm,
  },
  dateMeta: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: COMMON.spacing.sm,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: COMMON.borderRadius.sm,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
