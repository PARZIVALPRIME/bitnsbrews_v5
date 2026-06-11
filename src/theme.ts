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
  background: "#0b0d12",
  accent: "#8aa9ff",
  textPrimary: "#f4f6fa",
  textMuted: "rgba(226,232,244,0.66)",
  panelBackground: "rgba(15,18,26,0.94)",
  panelBorder: "rgba(255,255,255,0.08)",
};

export const ThemeContext = createContext<ThemeColors>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);
