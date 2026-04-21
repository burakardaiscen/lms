import React, { createContext, useState } from 'react';

// Context'imizi oluşturuyoruz
export const AuthContext = createContext();

// Tüm uygulamayı saracak olan Provider bileşeni
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};