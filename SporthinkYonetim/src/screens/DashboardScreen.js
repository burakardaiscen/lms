import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; 
import { useAuthStore } from '../store/useAuthStore';
import { getDashboardStats } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // SAYFAYA HER DÖNÜLDÜĞÜNDE OTOMATİK YENİLE
  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        if (user?.id) {
          const data = await getDashboardStats(user.id);
          setStats(data);
        }
        setLoading(false);
      };
      fetchStats();
    }, [user])
  );

  const userLevel = stats ? Math.floor(stats.xp / 1000) + 1 : 1;

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="mt-4 text-slate-500 font-medium">Veriler yükleniyor...</Text>
      </View>
    );
  }

  // Uyarı Banner'ı için Dinamik Stil
  const isAllCompleted = stats?.devamEden === 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* ÜST PROFİL ALANI */}
        <View className="bg-sky-600 rounded-b-3xl p-6 shadow-md pb-8">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-sky-100 text-sm font-bold mb-1">Tekrar Hoş Geldin,</Text>
              <Text className="text-white text-2xl font-extrabold">{user?.name}</Text>
              <Text className="text-sky-200 text-xs font-medium mt-1">{user?.department} • {user?.role}</Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('Notifications')} 
              className="bg-white/20 p-3 rounded-full relative"
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
              <View className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-sky-600" />
            </TouchableOpacity>
          </View>

          {/* SEVİYE VE MAĞAZA (ÖDÜL PAZARI) KARTI */}
          <View className="bg-white/10 rounded-2xl p-4 flex-row items-center justify-between border border-white/20">
            <View className="flex-row items-center flex-1">
              <View className="bg-yellow-400 w-14 h-14 rounded-full items-center justify-center border-4 border-white/20 shadow-sm">
                <Text className="text-sky-900 font-black text-xl">{userLevel}</Text>
              </View>
              <View className="ml-4 flex-1 mr-3">
                <Text className="text-white font-bold text-lg">Seviye {userLevel}</Text>
                <View className="w-full bg-white/20 h-2 rounded-full mt-1.5 overflow-hidden">
                  <View className="bg-yellow-400 h-full w-2/3 rounded-full" />
                </View>
                <Text className="text-sky-100 text-[10px] mt-1.5 font-bold uppercase tracking-wider">{stats?.xp} Toplam XP</Text>
              </View>
            </View>
            
            {/* İŞTE MAĞAZAYA GİDEN BUTON BURADA */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('RewardStore')}
              activeOpacity={0.8}
              className="bg-amber-500/20 border border-amber-400/30 px-4 py-3 rounded-2xl items-center justify-center"
            >
              <View className="flex-row items-center mb-1">
                <MaterialCommunityIcons name="database" size={16} color="#fcd34d" />
                <Text className="text-amber-300 font-black ml-1.5 text-base">{stats?.coin || 0}</Text>
              </View>
              <Text className="text-amber-200 text-[9px] font-bold uppercase">Mağaza</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="p-5 -mt-4">
          
          {/* AKSİYON KARTLARI (Eğitimler ve Asistan) */}
          <View className="flex-row justify-between mb-6">
            <TouchableOpacity 
              onPress={() => navigation.navigate('Eğitimler')}
              className="bg-white p-4 rounded-2xl flex-1 mr-2 shadow-sm border border-slate-100 items-center"
            >
              <View className="bg-indigo-100 p-3 rounded-full mb-3">
                <Ionicons name="play-circle" size={28} color="#4f46e5" />
              </View>
              <Text className="font-bold text-slate-800">Eğitimlerim</Text>
              <Text className="text-xs text-slate-500 mt-1 font-medium">Hemen Başla</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Asistan')}
              className="bg-white p-4 rounded-2xl flex-1 ml-2 shadow-sm border border-slate-100 items-center"
            >
              <View className="bg-emerald-100 p-3 rounded-full mb-3">
                <MaterialCommunityIcons name="robot-outline" size={28} color="#059669" />
              </View>
              <Text className="font-bold text-slate-800">AI Asistan</Text>
              <Text className="text-xs text-slate-500 mt-1 font-medium">Destek Al</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xl font-extrabold text-slate-900 mb-4 tracking-tight">Kişisel İstatistiklerin</Text>
          
          {/* DİNAMİK İSTATİSTİK KARTLARI (Kişisel Yüzde ve Devam Eden Modül) */}
          <View className="flex-row flex-wrap justify-between">
            <View className="bg-white w-[48%] p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm">
              <View className="bg-emerald-50 w-10 h-10 rounded-full items-center justify-center mb-3">
                <Ionicons name="trending-up" size={20} color="#059669" />
              </View>
              <Text className="text-3xl font-black text-slate-800">{stats?.tamamlanma}</Text>
              <Text className="text-[11px] text-slate-500 font-bold uppercase mt-1">İlerleme Oranı</Text>
            </View>
            
            <View className="bg-white w-[48%] p-5 rounded-3xl mb-4 border border-slate-100 shadow-sm">
              <View className="bg-orange-50 w-10 h-10 rounded-full items-center justify-center mb-3">
                <Ionicons name="book" size={20} color="#ea580c" />
              </View>
              <Text className="text-3xl font-black text-slate-800">{stats?.devamEden || 0}</Text>
              <Text className="text-[11px] text-slate-500 font-bold uppercase mt-1">Devam Eden Modül</Text>
            </View>
          </View>

          {/* DİNAMİK UYARI BANNER'I */}
          <View className={`p-5 rounded-3xl flex-row items-center mt-2 shadow-sm border ${isAllCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
            <View className={`${isAllCompleted ? 'bg-emerald-100' : 'bg-orange-100'} p-3 rounded-full mr-4`}>
              <Ionicons 
                name={isAllCompleted ? "checkmark-done" : "alert-circle"} 
                size={28} 
                color={isAllCompleted ? "#059669" : "#ea580c"} 
              />
            </View>
            <View className="flex-1">
              <Text className={`font-black text-base mb-1 ${isAllCompleted ? 'text-emerald-800' : 'text-orange-800'}`}>
                {isAllCompleted ? 'Harika İş Çıkardın!' : 'Eğitim Zamanı'}
              </Text>
              <Text className={`font-medium text-xs leading-5 ${isAllCompleted ? 'text-emerald-700' : 'text-orange-700'}`}>
                {stats?.kritikUyari}
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}