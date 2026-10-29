import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { THEMES, COMMON } from './src/constants/theme';
import { TodoService } from './src/services/todo-service';
import { Header } from './src/components/Header';
import { StatusFilterBar } from './src/components/StatusFilterBar';
import { TodoCard } from './src/components/TodoCard';
import { TodoModal } from './src/components/TodoModal';
import { EmptyState } from './src/components/EmptyState';

export default function App() {
  // Theme State: Default to Light mode, easily toggled to Dark mode
  const [isDark, setIsDark] = useState(false);
  const theme = useMemo(() => (isDark ? THEMES.dark : THEMES.light), [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const [todos, setTodos] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pagination states (Bounded query defense)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState(null);

  /**
   * Load status lookups once on mount
   */
  useEffect(() => {
    async function initStatuses() {
      try {
        const list = await TodoService.getStatuses();
        setStatuses(list);
      } catch (err) {
        console.warn('Could not load statuses, using defaults:', err.message);
      }
    }
    initStatuses();
  }, []);

  /**
   * Fetch paginated todos
   */
  const loadTodos = useCallback(
    async (targetPage = 1, isPullRefresh = false) => {
      try {
        if (isPullRefresh) {
          setIsRefreshing(true);
        } else if (targetPage === 1) {
          setIsLoading(true);
        }
        setErrorMessage('');

        const response = await TodoService.getTodos({
          page: targetPage,
          limit: 20,
          statusId: selectedStatusId,
          search: searchQuery,
        });

        if (targetPage === 1) {
          setTodos(response.todos);
        } else {
          setTodos((prev) => [...prev, ...response.todos]);
        }

        setTotalCount(response.pagination.total);
        setHasMore(response.pagination.page < response.pagination.total_pages);
        setPage(targetPage);
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load todos.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedStatusId, searchQuery]
  );

  useEffect(() => {
    loadTodos(1);
  }, [loadTodos]);

  const handleRefresh = () => {
    loadTodos(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && !isRefreshing && hasMore) {
      loadTodos(page + 1);
    }
  };

  const completedCount = useMemo(() => {
    return todos.filter((t) => t.status_code === 'completed').length;
  }, [todos]);

  const handleToggleStatus = async (item) => {
    if (!statuses.length) return;
    const currentIndex = statuses.findIndex((s) => s.id === item.status_id);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];

    const previousTodos = [...todos];
    setTodos((prev) =>
      prev.map((t) =>
        t.id === item.id
          ? {
              ...t,
              status_id: nextStatus.id,
              status_code: nextStatus.status_code,
              status_label: nextStatus.status_label,
              color_code: nextStatus.color_code,
            }
          : t
      )
    );

    try {
      await TodoService.updateTodo(item.id, { status_id: nextStatus.id });
    } catch (err) {
      Alert.alert('Update Failed', err.message);
      setTodos(previousTodos);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to remove this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const previous = [...todos];
            setTodos((prev) => prev.filter((t) => t.id !== id));
            setTotalCount((c) => Math.max(0, c - 1));

            try {
              await TodoService.deleteTodo(id);
            } catch (err) {
              Alert.alert('Delete Failed', err.message);
              setTodos(previous);
            }
          },
        },
      ]
    );
  };

  const handleOpenEdit = (item) => {
    setTodoToEdit(item);
    setModalVisible(true);
  };

  const handleOpenCreate = () => {
    setTodoToEdit(null);
    setModalVisible(true);
  };

  const handleModalSubmit = async (payload) => {
    try {
      if (todoToEdit) {
        const updated = await TodoService.updateTodo(todoToEdit.id, payload);
        setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await TodoService.createTodo(payload);
        setTodos((prev) => [created, ...prev]);
        setTotalCount((c) => c + 1);
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Action Failed', err.message);
    }
  };

  const renderItem = useCallback(
    ({ item }) => (
      <TodoCard
        item={item}
        onToggleStatus={handleToggleStatus}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        theme={theme}
      />
    ),
    [statuses, todos, theme]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />

      {/* Top Header with Theme Switcher */}
      <Header
        totalCount={totalCount}
        completedCount={completedCount}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        theme={theme}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.surface,
              borderColor: theme.surfaceBorder,
              color: theme.textPrimary,
            },
          ]}
          placeholder="🔍 Search tasks..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter Chips Bar */}
      <StatusFilterBar
        statuses={statuses}
        selectedStatusId={selectedStatusId}
        onSelectStatus={setSelectedStatusId}
        theme={theme}
      />

      {/* Error Banner */}
      {errorMessage ? (
        <View style={[styles.errorBanner, { backgroundColor: theme.dangerBg, borderColor: theme.danger }]}>
          <Text style={[styles.errorBannerText, { color: theme.danger }]}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}

      {/* Todo List View */}
      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Fetching tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={todos}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              message={searchQuery ? 'No matching tasks' : 'All clear!'}
              subMessage={
                searchQuery
                  ? 'Try searching with another keyword.'
                  : 'Tap the "+" button below to add your first task.'
              }
              theme={theme}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
        onPress={handleOpenCreate}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create / Edit Modal */}
      <TodoModal
        visible={modalVisible}
        todoToEdit={todoToEdit}
        statuses={statuses}
        onClose={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: COMMON.spacing.lg,
    marginVertical: COMMON.spacing.xs,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: COMMON.borderRadius.md,
    paddingHorizontal: COMMON.spacing.md,
    paddingVertical: 10,
    fontSize: 14,
  },
  errorBanner: {
    borderWidth: 1,
    marginHorizontal: COMMON.spacing.lg,
    padding: COMMON.spacing.sm,
    borderRadius: COMMON.borderRadius.md,
    marginVertical: COMMON.spacing.xs,
  },
  errorBannerText: {
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 90,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: COMMON.spacing.sm,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fabIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
    marginTop: -2,
  },
});
