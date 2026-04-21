import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { getAIResponse } from '../services/api'; // YENİ API FONKSİYONU ÇAĞRILDI

export default function ChatScreen() {
  const user = useAuthStore((state) => state.user);
  const flatListRef = useRef();

  const [messages, setMessages] = useState([
    { id: '1', text: `Merhaba ${user?.name?.split(' ')[0] || ''}! Ben Sporthink AI Asistanı. Sana eğitimler, şirket politikaları veya sistem hakkında nasıl yardımcı olabilirim?`, isUser: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // GERÇEK GEMINI API BAĞLANTISI
  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const userMsg = { id: Date.now().toString(), text: inputText, isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // API'den gerçek cevabı bekle
      const aiReply = await getAIResponse(userMsg.text, {
        name: user?.name,
        department: user?.department
      });

      // Gelen cevabı ekrana yaz
      const newAiMsg = { id: (Date.now() + 1).toString(), text: aiReply, isUser: false };
      setMessages((prev) => [...prev, newAiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg = { id: (Date.now() + 1).toString(), text: "Bir sorun oluştu kral.", isUser: false };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View className={`flex-row mb-4 ${item.isUser ? 'justify-end' : 'justify-start'}`}>
      {!item.isUser && (
        <View className="bg-sky-100 w-8 h-8 rounded-full items-center justify-center mr-2 mt-auto">
          <MaterialCommunityIcons name="robot-outline" size={20} color="#0284c7" />
        </View>
      )}
      <View className={`max-w-[80%] p-4 rounded-2xl ${item.isUser ? 'bg-sky-600 rounded-br-sm' : 'bg-white border border-slate-100 rounded-bl-sm shadow-sm'}`}>
        <Text className={`text-base ${item.isUser ? 'text-white' : 'text-slate-800'}`}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Üst Bar */}
        <View className="bg-white p-5 pt-6 pb-4 border-b border-slate-100 flex-row items-center shadow-sm z-10">
          <View className="bg-sky-100 p-2 rounded-full mr-3">
            <MaterialCommunityIcons name="robot-excited-outline" size={28} color="#0284c7" />
          </View>
          <View>
            <Text className="text-xl font-extrabold text-slate-900 tracking-tight">Sporthink AI</Text>
            <Text className="text-xs text-emerald-500 font-bold">● Çevrimiçi</Text>
          </View>
        </View>

        {/* Mesaj Listesi */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
          onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Yazıyor Animasyonu */}
        {isTyping && (
          <View className="px-5 pb-3 flex-row items-center">
            <ActivityIndicator size="small" color="#0284c7" />
            <Text className="text-slate-400 ml-2 font-medium text-xs">Yapay zeka düşünüyor...</Text>
          </View>
        )}

        {/* Mesaj Yazma Alanı */}
        <View className="p-4 bg-white border-t border-slate-100 flex-row items-center">
          <TextInput
            className="flex-1 bg-slate-100 p-4 rounded-full text-base border border-slate-200 mr-3"
            placeholder="AI Asistan'a bir şey sor..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            onPress={sendMessage}
            className={`w-12 h-12 rounded-full items-center justify-center ${inputText.trim() ? 'bg-sky-600' : 'bg-slate-300'}`}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons name="send" size={20} color="white" className="ml-1" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}