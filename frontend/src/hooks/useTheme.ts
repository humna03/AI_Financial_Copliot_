import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resolveIsDark, setThemeMode, type ThemeMode } from '../store/slices/themeSlice';

export function useTheme() {
  const mode = useAppSelector((s) => s.theme.mode);
  const dispatch = useAppDispatch();
  return {
    mode,
    isDark: resolveIsDark(mode),
    setMode: (next: ThemeMode) => dispatch(setThemeMode(next)),
  };
}
