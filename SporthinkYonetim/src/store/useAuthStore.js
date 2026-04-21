import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null, 
      hasSeenOnboarding: false, // YENİ: Tanıtımı izledi mi?
      
      login: (userData) => set({ user: userData }),
      logout: () => set({ user: null }),
      completeOnboarding: () => set({ hasSeenOnboarding: true }), // YENİ: Tanıtımı bitirme butonu için
    }),
    {
      name: 'sporthink-auth-storage', 
      storage: createJSONStorage(() => AsyncStorage), 
    }
  )
);