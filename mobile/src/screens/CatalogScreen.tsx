import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { catalogApi } from '../api/services';
import { BookCard } from '../components/BookCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateView } from '../components/StateView';
import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/tokens';

type Props = BottomTabScreenProps<MainTabsParamList, 'Catalog'>;

export function CatalogScreen({ route }: Props) {
  const root = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState(route.params?.initialSearch ?? '');
  const [submittedSearch, setSubmittedSearch] = useState(route.params?.initialSearch ?? '');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const categories = useQuery({ queryKey: ['categories'], queryFn: catalogApi.categories });
  const books = useInfiniteQuery({
    queryKey: ['books', submittedSearch, categoryId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => catalogApi.books({
      search: submittedSearch || undefined,
      category_id: categoryId,
      sort: 'title',
      direction: 'asc',
      page: pageParam,
      per_page: 20,
    }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta || meta.current_page >= meta.last_page) return undefined;
      return meta.current_page + 1;
    },
  });
  const bookItems = books.data?.pages.flatMap((page) => page.data) ?? [];

  useFocusEffect(useCallback(() => {
    if (route.params?.initialSearch !== undefined) {
      setSearch(route.params.initialSearch);
      setSubmittedSearch(route.params.initialSearch);
    }
  }, [route.params?.initialSearch]));

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Book catalog" subtitle="Search the library collection" />
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Title, author, or ISBN" placeholderTextColor={colors.textMuted} returnKeyType="search" onSubmitEditing={() => setSubmittedSearch(search.trim())} />
        {search ? <Pressable onPress={() => { setSearch(''); setSubmittedSearch(''); }}><Ionicons name="close-circle" size={20} color={colors.textMuted} /></Pressable> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <Pressable style={[styles.chip, categoryId === undefined && styles.chipActive]} onPress={() => setCategoryId(undefined)}><Text style={[styles.chipText, categoryId === undefined && styles.chipTextActive]}>All</Text></Pressable>
        {(categories.data?.data ?? []).map((category) => (
          <Pressable key={category.id} style={[styles.chip, categoryId === category.id && styles.chipActive]} onPress={() => setCategoryId(category.id)}>
            <Text style={[styles.chipText, categoryId === category.id && styles.chipTextActive]}>{category.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {books.isLoading ? <StateView loading message="Loading catalog…" /> : books.isError ? (
        <StateView title="Catalog unavailable" message={(books.error as Error).message} actionLabel="Retry" onAction={() => void books.refetch()} />
      ) : (
        <FlatList
          data={bookItems}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <BookCard book={item} onPress={() => root.navigate('BookDetail', { bookId: item.id })} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshing={books.isRefetching && !books.isFetchingNextPage}
          onRefresh={() => void books.refetch()}
          onEndReached={() => {
            if (books.hasNextPage && !books.isFetchingNextPage) void books.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<StateView icon="search-outline" title="No books found" message="Try a different search or category." />}
          ListFooterComponent={books.isFetchingNextPage ? <StateView loading message="Loading more books…" /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchBox: { margin: spacing.lg, marginBottom: spacing.sm, minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, paddingHorizontal: spacing.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  filters: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  chip: { height: 38, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
});
