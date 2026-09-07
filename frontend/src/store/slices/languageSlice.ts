import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Language } from '../../types/auth.types';

const LANG_KEY = 'afc_language';

export function applyDocumentDirection(lang: Language) {
  document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

interface LanguageState {
  current: Language;
}

const stored = (localStorage.getItem(LANG_KEY) as Language | null) ?? 'en';
const initialState: LanguageState = { current: stored };
applyDocumentDirection(initialState.current);

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<Language>) {
      state.current = action.payload;
      localStorage.setItem(LANG_KEY, action.payload);
      applyDocumentDirection(action.payload);
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
