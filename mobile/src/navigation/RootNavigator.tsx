import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/tokens';
import { BookDetailScreen } from '../screens/BookDetailScreen';
import { CatalogScreen } from '../screens/CatalogScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import type { AuthStackParamList, MainTabsParamList, RootStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

// The visual tab content stays 58px high. The Android navigation-bar inset is
// added below it so labels and icons never sit underneath Back/Home/Recents.
const TAB_BAR_CONTENT_HEIGHT = 58;
const MINIMUM_TAB_BAR_BOTTOM_PADDING = 8;

const tabIcons: Record<keyof MainTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Catalog: 'library-outline',
  Library: 'reader-outline',
  Profile: 'person-outline',
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, MINIMUM_TAB_BAR_BOTTOM_PADDING);

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Supplying a fixed height/padding here would override React
        // Navigation's Android safe-area values. Include the system inset in
        // both values so the visible tab buttons remain above the OS bar.
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_CONTENT_HEIGHT + bottomPadding,
            paddingBottom: bottomPadding,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size }) => <Ionicons name={tabIcons[route.name]} color={color} size={size} />,
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Catalog" component={CatalogScreen} options={{ title: 'Books' }} />
      <Tabs.Screen name="Library" component={LibraryScreen} options={{ title: 'My Library' }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <Ionicons name="library" size={64} color={colors.white} />
      <Text style={styles.splashTitle}>RCJK Library</Text>
      <ActivityIndicator color={colors.white} />
    </View>
  );
}

export function RootNavigator() {
  const { user, isRestoring } = useAuth();
  if (isRestoring) return <Splash />;

  if (user?.must_change_password) {
    return (
      <NavigationContainer>
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} initialParams={{ forced: true }} />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <RootStack.Navigator
          screenOptions={{
            headerTintColor: colors.white,
            headerStyle: { backgroundColor: colors.primaryDark },
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <RootStack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book Details' }} />
          <RootStack.Screen name="Notifications" component={NotificationsScreen} />
          <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
        </RootStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
          <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: { paddingTop: 6, borderTopColor: colors.border },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, backgroundColor: colors.primary },
  splashTitle: { color: colors.white, fontSize: 26, fontWeight: '800' },
});
