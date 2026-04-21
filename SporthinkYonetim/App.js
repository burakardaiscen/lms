import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  // Artık AuthProvider yok! Zustand her sayfadan doğrudan çağrılabilir.
  return <AppNavigator />;
}