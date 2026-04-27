import React, { createContext, useContext, useState } from "react";

type ThemeMode = "light" | "dark";

type Colors = {
  bg: string;
  card: string;
  text: string;
  border: string;
  input: string;
  red: string;
};

const lightColors: Colors = {
  bg: "#F8F9FA",
  card: "#FFFFFF",
  text: "#081229",
  border: "#F1F5F9",
  input: "#F8FAFC",
  red: "#E30613",
};

const darkColors: Colors = {
  bg: "#0F172A",
  card: "#111827",
  text: "#FFFFFF",
  border: "#1E293B",
  input: "#1E293B",
  red: "#E30613",
};

type ThemeContextType = {
  isDarkMode: boolean;
  theme: Colors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  theme: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: any) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = isDarkMode ? darkColors : lightColors;

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);