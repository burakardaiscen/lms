import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { getRewards, claimReward } from '../services/api';

export default function RewardStoreScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const data = await getRewards();
      setRewards(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (reward) => {
    Alert.alert(
      "Satın Alımı Onayla",
      `${reward.title} ödülünü ${reward.price} coin karşılığında almak istiyor musun?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Satın Al", 
          onPress: async () => {
            try {
              const res = await claimReward(user.id, reward.id, reward.price);
              Alert.alert("Tebrikler! 🎁", res.message);
            } catch (err) {
              Alert.alert("İşlem Başarısız", err.message || "Yetersiz bakiye.");
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      
      <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-slate-100 shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-slate-900">Ödül Pazarı</Text>
        <View className="w-8" />
      </View>

      <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
        <View className="bg-slate-900 p-6 rounded-[32px] mb-8 shadow-lg overflow-hidden relative">
          <MaterialCommunityIcons name="gift-outline" size={120} color="#334155" style={{ position: 'absolute', right: -20, top: -20, opacity: 0.5 }} />
          <Text className="text-slate-400 font-bold mb-1 uppercase text-xs tracking-widest">Mağaza Vitrini</Text>
          <Text className="text-white text-xl font-bold leading-8 mt-2">
            Eğitimlerden kazandığın coinleri şirket içi özel ödüllerle takas et.
          </Text>
        </View>

        <Text className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Tüm Ödüller</Text>

        <View className="flex-row flex-wrap justify-between">
          {rewards.map((item) => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => handlePurchase(item)}
              activeOpacity={0.8}
              style={{ width: Dimensions.get('window').width * 0.43 }}
              className="bg-white p-5 rounded-3xl mb-5 shadow-sm border border-slate-100 items-center"
            >
              <View className="bg-sky-50 w-16 h-16 rounded-full items-center justify-center mb-4 border border-sky-100">
                <MaterialCommunityIcons name={item.icon || 'gift'} size={32} color="#0284c7" />
              </View>
              <Text className="font-black text-slate-800 mb-4 text-center text-sm" numberOfLines={2}>
                {item.title}
              </Text>
              
              <View className="bg-amber-50 px-3 py-2 rounded-xl flex-row items-center w-full justify-center border border-amber-100 mt-auto">
                <MaterialCommunityIcons name="database" size={16} color="#d97706" />
                <Text className="ml-1.5 font-black text-amber-700 text-sm">{item.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}