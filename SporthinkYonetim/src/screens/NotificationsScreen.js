import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { getNotifications, markNotificationRead } from '../services/api';

export default function NotificationsScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchNotifs = async () => {
        if (user?.id) {
          const data = await getNotifications(user.id);
          setNotifications(data);
        }
        setLoading(false);
      };
      fetchNotifs();
    }, [user])
  );

  const handlePress = async (id, isRead) => {
    if (!isRead) {
      await markNotificationRead(id);
      // Ekrandaki listeyi anında güncelle
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => handlePress(item.id, item.is_read)}
      className={`p-4 mb-3 rounded-2xl flex-row items-start border ${item.is_read ? 'bg-white border-slate-100' : 'bg-sky-50 border-sky-200'} shadow-sm`}
    >
      <View className={`p-2 rounded-full mr-3 ${item.is_read ? 'bg-slate-100' : 'bg-sky-200'}`}>
        <Ionicons name={item.type === 'duyuru' ? "megaphone" : "notifications"} size={24} color={item.is_read ? "#94a3b8" : "#0284c7"} />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-bold ${item.is_read ? 'text-slate-600' : 'text-slate-900'}`}>{item.title}</Text>
        <Text className={`text-sm mt-1 leading-5 ${item.is_read ? 'text-slate-400' : 'text-slate-700'}`}>{item.message}</Text>
      </View>
      {!item.is_read && <View className="w-3 h-3 bg-red-500 rounded-full mt-2 ml-2" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center p-5 bg-white border-b border-slate-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900">Bildirimler</Text>
      </View>
      
      {loading ? <ActivityIndicator size="large" color="#0284c7" className="mt-10" /> : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text className="text-center text-slate-500 mt-10">Yeni bildirim yok.</Text>}
        />
      )}
    </SafeAreaView>
  );
}