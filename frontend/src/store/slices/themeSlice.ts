import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'afc_theme_mode';

function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function resolveIsDark(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && systemPrefersDark());
}

export function applyThemeClass(mode: ThemeMode) {
  const isDark = resolveIsDark(mode);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
}

interface ThemeState {
  mode: ThemeMode;
}

const stored = (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? 'system';
const initialState: ThemeState = { mode: stored };
applyThemeClass(initialState.mode);

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
      localStorage.setItem(THEME_KEY, action.payload);
      applyThemeClass(action.payload);
    },
  },
});

export const { setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
