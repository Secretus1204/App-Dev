import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string } | undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Catalog: { initialSearch?: string } | undefined;
  Library: { initialTab?: 'requests' | 'borrowed' | 'history' } | undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  BookDetail: { bookId: number };
  Notifications: undefined;
  ChangePassword: { forced?: boolean } | undefined;
};
