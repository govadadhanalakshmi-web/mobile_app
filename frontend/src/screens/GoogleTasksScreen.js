import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { TodoService } from '../services/todo-service';
import { GoogleTasksHeader } from '../components/GoogleTasksHeader';
import { GoogleTaskItem } from '../components/GoogleTaskItem';
import { GoogleTaskModal } from '../components/GoogleTaskModal';

const TABS = [
  { id: 'my_tasks', label: 'My Tasks' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
];

export function GoogleTasksScreen({ isDark, onToggleTheme, theme }) {
  const { user, token, logout } = useAuth();

  const [todos, setTodos] = useState([]);
  const [activeTab, setActiveTab] = useState('my_tasks');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState(null);

  // 1. Fetch Todos
  const loadTodos = useCallback(async () => {
    try {
      const res = await TodoService.getTodos({ page: 1, limit: 50 }, token);
      setTodos(res.todos || []);
    } catch (e) {
      // SWR fallback handled in service
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTodos();
  };

  // 2. Filtered list based on active tab
  const filteredTodos = useMemo(() => {
    if (activeTab === 'completed') {
      return todos.filter((t) => Number(t.status_id) === 3);
    }
    if (activeTab === 'my_tasks') {
      return todos.filter((t) => Number(t.status_id) !== 3);
    }
    return todos;
  }, [todos, activeTab]);

  // 3. Toggle Completion (Circular Checkbox tap)
  const handleToggleComplete = async (todo) => {
    const isCompleted = Number(todo.status_id) === 3;
    const newStatusId = isCompleted ? 1 : 3;

    // Optimistic UI update
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id
          ? {
              ...t,
              status_id: newStatusId,
              status_code: newStatusId === 3 ? 'completed' : 'pending',
              status_label: newStatusId === 3 ? 'Completed' : 'Pending',
            }
          : t
      )
    );

    try {
      await TodoService.updateTodo(todo.id, { status_id: newStatusId }, token);
    } catch {
      // Revert if API failed
      loadTodos();
    }
  };

  // 4. Create / Edit Task
  const handleSaveTask = async (data) => {
    setModalVisible(false);
    try {
      if (todoToEdit) {
        // Edit
        setTodos((prev) =>
          prev.map((t) => (t.id === todoToEdit.id ? { ...t, ...data } : t))
        );
        await TodoService.updateTodo(todoToEdit.id, data, token);
      } else {
        // Create
        const created = await TodoService.createTodo(data, token);
        if (created) {
          setTodos((prev) => [created, ...prev]);
        }
      }
    } catch {
      loadTodos();
    } finally {
      setTodoToEdit(null);
    }
  };

  // 5. Delete Task
  const handleDeleteTask = async (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await TodoService.deleteTodo(id, token);
    } catch {
      loadTodos();
    }
  };

  const handleOpenCreateModal = () => {
    setTodoToEdit(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (todo) => {
    setTodoToEdit(todo);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* 1. Google Tasks Header (Zero Overflow) */}
      <GoogleTasksHeader
        user={user}
        onLogout={logout}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        theme={theme}
      />

      {/* 2. Minimalist Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.surfaceBorder }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                isActive && [styles.activeTabItem, { borderBottomColor: theme.primary }],
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
              accessibilityLabel={`Filter by ${tab.label}`}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? theme.primaryLight : theme.textMuted },
                  isActive && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Task List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredTodos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
            {activeTab === 'completed'
              ? 'No completed tasks yet'
              : 'All tasks completed! Enjoy your day.'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Tap + below to add a new task.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTodos}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <GoogleTaskItem
              todo={item}
              onToggleComplete={handleToggleComplete}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteTask}
              theme={theme}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

      {/* 4. Google Tasks Material Floating Action Button (+) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={handleOpenCreateModal}
        activeOpacity={0.8}
        accessibilityLabel="+"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* 5. Quick Add & Edit Modal */}
      <GoogleTaskModal
        visible={modalVisible}
        todoToEdit={todoToEdit}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSaveTask}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 90,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
});

