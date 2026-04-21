import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { getLeaderboard, getRewards, claimReward, getDashboardStats } from '../services/api';

export default function LeaderboardScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('ranking');
  
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [rewardsData, setRewardsData] = useState([]);
  const [userCoin, setUserCoin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  // Sayfaya girildiğinde tüm güncel verileri çek
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        if (user?.id) {
          // 1. Sıralamayı çek
          const boardData = await getLeaderboard();
          setLeaderboardData(boardData);
          
          // 2. Ödülleri çek
          const rewardData = await getRewards();
          setRewardsData(rewardData);

          // 3. Kullanıcının güncel Coin'ini çekmek için Dashboard ucunu kullanıyoruz
          const stats = await getDashboardStats(user.id);
          setUserCoin(stats?.coin || 0);
        }
        setLoading(false);
      };
      fetchData();
    }, [user])
  );

  // Ödül Satın Alma İşlemi
  const handleBuyReward = async (reward) => {
    Alert.alert(
      "Ödül Talebi",
      `"${reward.title}" ödülünü ${reward.price} Coin karşılığında talep etmek istediğine emin misin?`,
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Evet, Satın Al", 
          onPress: async () => {
            setBuying(true);
            try {
              const result = await claimReward(user.id, reward.id, reward.price);
              Alert.alert("Başarılı! 🎉", result.message);
              setUserCoin(result.yeniCoin); // Ekrandaki Coin miktarını anında düş
            } catch (error) {
              Alert.alert("Hata", error.message);
            } finally {
              setBuying(false);
            }
          }
        }
      ]
    );
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const rank = index + 1;
    const isMe = user?.id === item.id; 

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
        className={`flex-row items-center p-4 mb-3 rounded-2xl border ${isMe ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-100'} shadow-sm`}
      >
        <View className="w-8 items-center justify-center">
          {rank === 1 ? <FontAwesome5 name="medal" size={24} color="#FBBF24" /> : 
           rank === 2 ? <FontAwesome5 name="medal" size={24} color="#94A3B8" /> : 
           rank === 3 ? <FontAwesome5 name="medal" size={24} color="#B45309" /> : 
           <Text className="font-bold text-slate-400 text-lg">{rank}</Text>}
        </View>
        <View className="flex-1 ml-4">
          <Text className={`text-base font-bold ${isMe ? 'text-sky-700' : 'text-slate-800'}`}>
            {item.ad} {item.soyad} {isMe && '(Sen)'}
          </Text>
          <Text className="text-xs text-slate-500 font-medium">{item.departman}</Text>
        </View>
        <View className="bg-orange-100 px-3 py-1 rounded-full">
          <Text className="text-orange-600 font-extrabold">{item.xp} XP</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRewardItem = ({ item }) => {
    // Parası yetiyorsa buton aktif, yetmiyorsa pasif
    const canAfford = userCoin >= item.price;

    return (
      <View className="bg-white p-4 mb-4 rounded-2xl border border-slate-100 shadow-sm flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-2">
          <View className="bg-sky-100 p-3 rounded-full mr-4">
            <MaterialCommunityIcons name={item.icon} size={28} color="#0284c7" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-800">{item.title}</Text>
            <View className="flex-row items-center mt-1">
              <FontAwesome5 name="coins" size={14} color={canAfford ? "#FCD34D" : "#94A3B8"} />
              <Text className={`font-bold ml-1 ${canAfford ? "text-yellow-500" : "text-slate-400"}`}>
                {item.price} Coin
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          disabled={!canAfford || buying}
          onPress={() => handleBuyReward(item)}
          className={`px-4 py-2 rounded-xl ${canAfford ? 'bg-sky-600' : 'bg-slate-200'}`}
        >
          <Text className={`font-bold ${canAfford ? 'text-white' : 'text-slate-400'}`}>
            {canAfford ? 'Satın Al' : 'Yetersiz'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-5 flex-1">
        
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">Oyunlaştırma</Text>
          <View className="flex-row items-center bg-yellow-100 px-4 py-2 rounded-full border border-yellow-200 shadow-sm">
            <FontAwesome5 name="coins" size={16} color="#D97706" />
            <Text className="text-yellow-700 font-extrabold ml-2 text-lg">{userCoin}</Text>
          </View>
        </View>

        <View className="flex-row bg-slate-200 rounded-xl p-1 mb-6">
          <TouchableOpacity 
            onPress={() => setActiveTab('ranking')}
            className={`flex-1 py-3 items-center rounded-lg ${activeTab === 'ranking' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'ranking' ? 'text-sky-600' : 'text-slate-500'}`}>🏆 Sıralama</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('market')}
            className={`flex-1 py-3 items-center rounded-lg ${activeTab === 'market' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'market' ? 'text-sky-600' : 'text-slate-500'}`}>🛍️ Ödül Pazarı</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0284c7" className="mt-10" />
        ) : activeTab === 'ranking' ? (
          <FlatList
            data={leaderboardData}
            keyExtractor={item => item.id.toString()}
            renderItem={renderLeaderboardItem}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={rewardsData}
            keyExtractor={item => item.id.toString()}
            renderItem={renderRewardItem}
            showsVerticalScrollIndicator={false}
          />
        )}

      </View>
    </SafeAreaView>
  );
}