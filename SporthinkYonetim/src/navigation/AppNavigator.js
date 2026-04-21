import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuthStore } from '../store/useAuthStore';

// EKRANLAR
import OnboardingScreen from '../screens/OnboardingScreen'; 
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import UsersScreen from '../screens/UsersScreen';
import TrainingScreen from '../screens/TrainingScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ChatScreen from '../screens/ChatScreen';
import UserProfileScreen from '../screens/UserProfileScreen'; 
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen'; 
import AdminPanelScreen from '../screens/AdminPanelScreen'; 
import QuizScreen from '../screens/QuizScreen';
import PerformanceDetailScreen from '../screens/PerformanceDetailScreen';
import CertificatesScreen from '../screens/CertificatesScreen';
import RewardStoreScreen from '../screens/RewardStoreScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TrainingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainingList" component={TrainingScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} /> 
    </Stack.Navigator>
  );
}

function MainTabs() {
  const user = useAuthStore((state) => state.user);

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Ana Sayfa') iconName = 'home';
        else if (route.name === 'Eğitimler') iconName = 'play-circle'; 
        else if (route.name === 'Liderlik') iconName = 'trophy';
        else if (route.name === 'Kullanıcılar') iconName = 'people';
        else if (route.name === 'Yönetim') iconName = 'briefcase'; 
        else if (route.name === 'Ayarlar') iconName = 'settings'; 
        
        if (route.name === 'Asistan') {
          return <MaterialCommunityIcons name="robot-outline" size={size} color={color} />;
        }
        
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#0284c7',
      tabBarInactiveTintColor: 'gray',
    })}>
      <Tab.Screen name="Ana Sayfa" component={DashboardScreen} />
      <Tab.Screen name="Eğitimler" component={TrainingStack} /> 
      <Tab.Screen name="Liderlik" component={LeaderboardScreen} />
      <Tab.Screen name="Asistan" component={ChatScreen} />
      <Tab.Screen name="Kullanıcılar" component={UsersScreen} />
      {user?.role === 'IK_YONETICI' && <Tab.Screen name="Yönetim" component={AdminPanelScreen} />}
      <Tab.Screen name="Ayarlar" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const user = useAuthStore((state) => state.user);
  const hasSeenOnboarding = useAuthStore((state) => state.hasSeenOnboarding);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : user == null ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="PerformanceDetail" component={PerformanceDetailScreen} />
            <Stack.Screen name="Certificates" component={CertificatesScreen} />
            <Stack.Screen name="RewardStore" component={RewardStoreScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}