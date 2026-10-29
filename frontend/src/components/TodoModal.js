import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { COMMON } from '../constants/theme';

export function TodoModal({
  visible,
  todoToEdit = null,
  statuses = [],
  onClose,
  onSubmit,
  theme,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (todoToEdit) {
      setTitle(todoToEdit.title || '');
      setDescription(todoToEdit.description || '');
      setStatusId(todoToEdit.status_id || 1);
      setDueDate(todoToEdit.due_date || '');
    } else {
      setTitle('');
      setDescription('');
      setStatusId(statuses[0]?.id || 1);
      const today = new Date().toISOString().split('T')[0];
      setDueDate(today);
    }
    setError('');
  }, [todoToEdit, visible]);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a task title.');
      return;
    }

    if (dueDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dueDate.trim())) {
        setError('Due date must be in YYYY-MM-DD format.');
        return;
      }
    }

    setError('');
    onSubmit({
      title: trimmedTitle,
      description: description.trim() || null,
      status_id: statusId,
      due_date: dueDate.trim() || null,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.surfaceBorder }]}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {todoToEdit ? 'Edit Task' : 'Create New Task'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceActive }]}
            >
              <Text style={[styles.closeBtnText, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
                <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
              </View>
            ) : null}

            {/* Title Input */}
            <Text style={[styles.label, { color: theme.textMuted }]}>TASK TITLE *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.surfaceBorder,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="e.g., Design database schema"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError('');
              }}
              maxLength={255}
            />

            {/* Description Input */}
            <Text style={[styles.label, { color: theme.textMuted }]}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.surfaceBorder,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="Add key details or acceptance criteria..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Status Selection */}
            <Text style={[styles.label, { color: theme.textMuted }]}>STATUS</Text>
            <View style={styles.statusRow}>
              {statuses.map((s) => {
                const isSelected = statusId === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.statusSelectChip,
                      { borderColor: theme.surfaceBorder, backgroundColor: theme.background },
                      isSelected && { backgroundColor: theme.primary, borderColor: theme.primaryLight },
                    ]}
                    onPress={() => setStatusId(s.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.statusSelectText,
                        { color: isSelected ? '#ffffff' : theme.textSecondary },
                      ]}
                    >
                      {s.status_label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Due Date */}
            <Text style={[styles.label, { color: theme.textMuted }]}>DUE DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.surfaceBorder,
                  color: theme.textPrimary,
                },
              ]}
              placeholder="2026-12-31"
              placeholderTextColor={theme.textMuted}
              value={dueDate}
              onChangeText={setDueDate}
              maxLength={10}
            />
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footer, { borderTopColor: theme.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.surfaceActive }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveText}>
                {todoToEdit ? 'Save Changes' : 'Create Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: COMMON.borderRadius.lg,
    borderTopRightRadius: COMMON.borderRadius.lg,
    borderTopWidth: 1,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: COMMON.spacing.lg,
    paddingVertical: COMMON.spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollArea: {
    paddingHorizontal: COMMON.spacing.lg,
    paddingTop: COMMON.spacing.md,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: COMMON.borderRadius.md,
    padding: COMMON.spacing.sm,
    marginBottom: COMMON.spacing.md,
  },
  errorText: {
    fontSize: 13,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: COMMON.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: COMMON.borderRadius.md,
    paddingHorizontal: COMMON.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 80,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COMMON.spacing.sm,
    marginBottom: COMMON.spacing.sm,
  },
  statusSelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: COMMON.borderRadius.full,
    borderWidth: 1,
  },
  statusSelectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: COMMON.spacing.lg,
    paddingTop: COMMON.spacing.md,
    gap: COMMON.spacing.md,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: COMMON.borderRadius.md,
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: COMMON.borderRadius.md,
    alignItems: 'center',
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
