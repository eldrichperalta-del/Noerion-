import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ThemeContext = createContext(null);

export const defaultPreferences = {
  language: "en",
  timeZone: "Asia/Manila",
  dateFormat: "MM/DD/YYYY",
  theme: "light",
};

export function ThemeProvider({ children }) {
  const { pathname } = useLocation();
  const dashboardScope = ["admin", "trainee", "assessor"].find((role) => pathname.startsWith(`/${role}`)) || "public";
  const [userId, setUserId] = useState("guest");
  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    let mounted = true;
    const loadPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      const id = user?.id || "guest";
      const localPreferences = JSON.parse(localStorage.getItem(`noerion-preferences:${id}:${dashboardScope}`) || "null");
      const accountPreferences = user?.user_metadata?.dashboard_preferences?.[dashboardScope];
      setUserId(id);
      setPreferences({ ...defaultPreferences, ...(localPreferences || accountPreferences || {}) });
    };
    loadPreferences();
    return () => { mounted = false; };
  }, [dashboardScope]);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.lang = preferences.language;
  }, [preferences.language, preferences.theme]);

  const updatePreferences = (updates) => setPreferences((current) => ({ ...current, ...updates }));

  const savePreferences = async (nextPreferences = preferences) => {
    const next = { ...defaultPreferences, ...nextPreferences };
    localStorage.setItem(`noerion-preferences:${userId}:${dashboardScope}`, JSON.stringify(next));
    setPreferences(next);
    if (userId !== "guest") {
      const { data: { user } } = await supabase.auth.getUser();
      const savedPreferences = user?.user_metadata?.dashboard_preferences || {};
      const { error } = await supabase.auth.updateUser({
        data: { dashboard_preferences: { ...savedPreferences, [dashboardScope]: next } },
      });
      if (error) throw error;
    }
  };

  const value = useMemo(() => ({
    preferences,
    updatePreferences,
    savePreferences,
    theme: preferences.theme,
    setTheme: (theme) => updatePreferences({ theme }),
    dashboardScope,
    userId,
  }), [preferences, dashboardScope, userId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
