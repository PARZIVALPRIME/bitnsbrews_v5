import { createContext, useContext } from "react";

export type Quality = "desktop" | "mobile";

export const QualityContext = createContext<Quality>("desktop");

export function useQuality(): Quality {
  return useContext(QualityContext);
}
