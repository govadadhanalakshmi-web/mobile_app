import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const GoogleTaskItem = memo(function GoogleTaskItem({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
  theme,
}) {
  const isCompleted = Number(todo.status_id) === 3;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.surfaceBorder,
        },
      ]}
    >
      {/* 1. Circular Checkbox (Google Tasks Standard) */}
      <TouchableOpacity
        style={[
          styles.circularCheckbox,
          { borderColor: isCompleted ? theme.primary : theme.textMuted },
          isCompleted && { backgroundColor: theme.primary },
        ]}
        onPress={() => onToggleComplete(todo)}
        activeOpacity={0.7}
        accessibilityLabel={`Mark task ${todo.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      {/* 2. Task Content (Title, Details, Due Date) */}
      <TouchableOpacity
        style={styles.contentCol}
        onPress={() => onEdit(todo)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.titleText,
            { color: isCompleted ? theme.textMuted : theme.textPrimary },
            isCompleted && styles.strikethrough,
          ]}
          numberOfLines={2}
        >
          {todo.title}
        </Text>

        {todo.description ? (
          <Text
            style={[styles.descriptionText, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {todo.description}
          </Text>
        ) : null}

        {/* Due Date Badge */}
        {todo.due_date ? (
          <View style={styles.metaRow}>
            <View
              style={[
                styles.dateChip,
                { backgroundColor: theme.surfaceActive, borderColor: theme.surfaceBorder },
              ]}
            >
              <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                📅 {todo.due_date}
              </Text>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* 3. Delete Action */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(todo.id)}
        activeOpacity={0.6}
        accessibilityLabel="Delete task"
      >
        <Text style={[styles.deleteIcon, { color: theme.textMuted }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  circularCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 16,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  contentCol: {
    flex: 1,
    flexShrink: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  descriptionText: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dateChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 6,
    marginLeft: 10,
    marginTop: -2,
  },
  deleteIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
});

