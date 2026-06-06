import { createContext, useContext } from "react";

export type ThemeColors = {
  background: string;
  accent: string;
  textPrimary: string;
  textMuted: string;
  panelBackground: string;
  panelBorder: string;
};

export const defaultTheme: ThemeColors = {
  background: "#030407",
  accent: "#e8a23a",
  textPrimary: "#ffffff",
  textMuted: "rgba(255,255,255,0.7)",
  panelBackground: "rgba(3,4,7,0.85)",
  panelBorder: "rgba(255,255,255,0.05)",
};

export const ThemeContext = createContext<ThemeColors>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);
