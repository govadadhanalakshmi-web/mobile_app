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

export function GoogleTaskModal({
  visible,
  todoToEdit = null,
  onClose,
  onSubmit,
  theme,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (todoToEdit) {
      setTitle(todoToEdit.title || '');
      setDescription(todoToEdit.description || '');
      setDueDate(todoToEdit.due_date || '');
    } else {
      setTitle('');
      setDescription('');
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
        setError('Due date must be YYYY-MM-DD.');
        return;
      }
    }

    setError('');
    onSubmit({
      title: trimmedTitle,
      description: description.trim() || null,
      due_date: dueDate.trim() || null,
      status_id: todoToEdit ? todoToEdit.status_id : 1,
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: theme.surface, borderColor: theme.surfaceBorder },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
              {todoToEdit ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <ScrollView
            style={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title Input */}
            <TextInput
              style={[
                styles.titleInput,
                { color: theme.textPrimary, borderColor: theme.surfaceBorder },
              ]}
              placeholder="Enter task title"
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus={true}
            />

            {/* Details Input */}
            <TextInput
              style={[
                styles.descriptionInput,
                { color: theme.textPrimary, borderColor: theme.surfaceBorder },
              ]}
              placeholder="Add details"
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {/* Due Date Input */}
            <View style={styles.dateRow}>
              <Text style={[styles.dateLabel, { color: theme.textMuted }]}>
                📅 Due Date:
              </Text>
              <TextInput
                style={[
                  styles.dateInput,
                  { color: theme.textPrimary, borderColor: theme.surfaceBorder },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
                value={dueDate}
                onChangeText={setDueDate}
                maxLength={10}
              />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footerRow, { borderTopColor: theme.surfaceBorder }]}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: '600',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  descriptionInput: {
    fontSize: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

