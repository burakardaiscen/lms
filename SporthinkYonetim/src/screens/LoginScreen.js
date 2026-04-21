import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { loginUser } from '../services/api';

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Gerçek API çağrısını yapıyoruz
      const response = await loginUser(email, password);
      
      // Backend'den 'user' anahtarıyla dönen bilgileri Zustand hafızasına yazıyoruz
      if (response && response.user) {
        login(response.user);
      } else {
        throw new Error("Beklenmedik veri formatı.");
      }
      
    } catch (error) {
      // Backend'den gelen 'E-posta veya şifre hatalı!' mesajı burada yakalanır
      Alert.alert('Giriş Başarısız', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center p-5 bg-white">
      <Text className="text-4xl font-extrabold text-sky-900 text-center mb-2 tracking-tight">Sporthink LMS</Text>
      <Text className="text-base text-slate-500 text-center mb-10 font-medium">Yönetici Paneli</Text>
      
      <TextInput
        className="bg-slate-100 p-4 rounded-2xl mb-4 text-base border border-slate-200"
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        className="bg-slate-100 p-4 rounded-2xl mb-6 text-base border border-slate-200"
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        className={`p-4 rounded-2xl items-center shadow-sm ${isLoading ? 'bg-sky-400' : 'bg-sky-600 shadow-sky-300'}`} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">Giriş Yap</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}