import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { catalogApi, libraryApi, notificationApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { BookCard } from '../components/BookCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { StateView } from '../components/StateView';
import type { MainTabsParamList, RootStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing } from '../theme/tokens';
import { formatDate, greeting } from '../utils/format';

type Props = BottomTabScreenProps<MainTabsParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const root = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const books = useQuery({ queryKey: ['books', 'home'], queryFn: () => catalogApi.books({ sort: 'created_at', direction: 'desc', per_page: 6 }) });
  const categories = useQuery({ queryKey: ['categories'], queryFn: catalogApi.categories });
  const loans = useQuery({ queryKey: ['loans'], queryFn: libraryApi.loans });
  const requests = useQuery({ queryKey: ['borrow-requests'], queryFn: libraryApi.requests });
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list });
  const activeLoan = loans.data?.data.find((loan) => loan.status !== 'returned');
  const unread = notifications.data?.meta?.unread_count ?? 0;
  const pendingRequests = (requests.data?.data ?? []).filter((request) => request.status === 'pending').length;

  const refresh = async () => {
    await Promise.all([books.refetch(), categories.refetch(), loans.refetch(), requests.refetch(), notifications.refetch()]);
  };

  const openSearch = () => navigation.navigate('Catalog', { initialSearch: search.trim() || undefined });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        subtitle={`${greeting()}, ${user?.name.split(' ')[0] ?? 'Reader'}`}
        title="Find your next book"
        badge={unread}
        onNotifications={() => root.navigate('Notifications')}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={books.isRefetching || loans.isRefetching || requests.isRefetching || notifications.isRefetching} onRefresh={() => void refresh()} tintColor={colors.primary} />}
      >
        <View style={styles.searchBox}>
          <Ionicons name="search" size={21} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search title, author, or ISBN"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={openSearch}
          />
          <Pressable onPress={openSearch}><Ionicons name="arrow-forward-circle" size={29} color={colors.primary} /></Pressable>
        </View>

        {activeLoan ? (
          <Pressable style={styles.loanCard} onPress={() => navigation.navigate('Library')}>
            <View style={styles.loanIcon}><Ionicons name="book" size={25} color={colors.white} /></View>
            <View style={styles.flex}>
              <Text style={styles.eyebrow}>CURRENTLY BORROWED</Text>
              <Text style={styles.loanTitle} numberOfLines={1}>{activeLoan.book_copy.book.title}</Text>
              <Text style={styles.loanDue}>Due {formatDate(activeLoan.due_at)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.primaryDark} />
          </Pressable>
        ) : (
          <View style={styles.welcomeCard}>
            <Ionicons name="sparkles-outline" size={26} color={colors.primary} />
            <View style={styles.flex}>
              <Text style={styles.welcomeTitle}>Your shelf is ready</Text>
              <Text style={styles.welcomeText}>Browse the catalog and request an available book.</Text>
            </View>
          </View>
        )}

        {pendingRequests > 0 ? (
          <Pressable style={styles.requestCard} onPress={() => navigation.navigate('Library', { initialTab: 'requests' })}>
            <Ionicons name="time-outline" size={23} color={colors.warning} />
            <View style={styles.flex}>
              <Text style={styles.requestTitle}>{pendingRequests} request{pendingRequests === 1 ? '' : 's'} awaiting review</Text>
              <Text style={styles.requestText}>You will receive a notification when the librarian responds.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}

        <View>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Categories</Text><Text style={styles.seeAll} onPress={() => navigation.navigate('Catalog')}>See all</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {(categories.data?.data ?? []).map((category) => (
              <Pressable key={category.id} style={styles.categoryChip} onPress={() => navigation.navigate('Catalog')}>
                <Ionicons name="bookmark-outline" size={17} color={colors.primary} />
                <Text style={styles.categoryText}>{category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recently added</Text><Text style={styles.seeAll} onPress={() => navigation.navigate('Catalog')}>Browse books</Text></View>
        {books.isLoading ? <StateView loading message="Loading books…" /> : null}
        {books.isError ? <StateView title="Could not load books" message={(books.error as Error).message} actionLabel="Retry" onAction={() => void books.refetch()} /> : null}
        <View style={styles.list}>
          {(books.data?.data ?? []).map((book) => <BookCard key={book.id} book={book} onPress={() => root.navigate('BookDetail', { bookId: book.id })} />)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  searchBox: { marginTop: -8, height: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, paddingHorizontal: spacing.lg, backgroundColor: colors.white, ...shadow.card },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  loanCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: '#FDECEF', borderRadius: radius.lg, borderWidth: 1, borderColor: '#F7CBD3' },
  loanIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  loanTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 2 },
  loanDue: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  welcomeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, ...shadow.card },
  welcomeTitle: { color: colors.text, fontWeight: '700' },
  welcomeText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  requestCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: '#FFF6E8', borderRadius: radius.lg, borderWidth: 1, borderColor: '#F4D8A8' },
  requestTitle: { color: colors.text, fontWeight: '700' },
  requestText: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  categoryRow: { gap: spacing.sm, paddingTop: spacing.md },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  categoryText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  list: { gap: spacing.md },
});
