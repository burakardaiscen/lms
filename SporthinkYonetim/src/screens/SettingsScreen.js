import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { updatePassword } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = async () => {
    if (newPassword.length < 4) {
      Alert.alert("Hata", "Şifre biraz daha uzun olsun kral.");
      return;
    }
    try {
      await updatePassword(user.id, newPassword);
      Alert.alert("Başarılı", "Şifren güncellendi!");
      setNewPassword('');
    } catch (error) {
      Alert.alert("Hata", "Şifre güncellenemedi.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-5 flex-row items-center bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={28} /></TouchableOpacity>
        <Text className="text-xl font-bold ml-4">Ayarlar & Profil</Text>
      </View>

      <ScrollView className="p-5">
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 items-center">
          <View className="w-20 h-20 bg-sky-600 rounded-full items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">{user?.name?.charAt(0)}</Text>
          </View>
          <Text className="text-xl font-bold text-slate-800">{user?.name}</Text>
          <Text className="text-slate-500">{user?.department} • {user?.role}</Text>
        </View>

        <Text className="text-slate-500 font-bold mb-3 ml-2 uppercase text-xs">Güvenlik</Text>
        <View className="bg-white p-4 rounded-3xl border border-slate-100 mb-6">
          <TextInput 
            className="bg-slate-50 p-4 rounded-2xl mb-4"
            placeholder="Yeni Şifre"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={handlePasswordChange} className="bg-sky-600 p-4 rounded-2xl items-center">
            <Text className="text-white font-bold">Şifreyi Güncelle</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => {
            Alert.alert("Çıkış", "Oturumu kapatmak istediğine emin misin?", [
              { text: "Vazgeç" },
              { text: "Çıkış Yap", onPress: logout, style: 'destructive' }
            ]);
          }}
          className="bg-red-50 p-5 rounded-3xl flex-row items-center justify-center border border-red-100"
        >
          <Ionicons name="log-out" size={24} color="#ef4444" />
          <Text className="text-red-500 font-bold ml-2">Güvenli Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}