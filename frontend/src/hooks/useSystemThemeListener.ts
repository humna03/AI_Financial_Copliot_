import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { applyThemeClass } from '../store/slices/themeSlice';

/** When the user's preference is "system", re-applies the light/dark class
 * if the OS-level color scheme changes while the app is open (e.g. a
 * scheduled night mode kicking in), instead of only picking it up on the
 * next reload or manual toggle. */
export function useSystemThemeListener() {
  const mode = useAppSelector((s) => s.theme.mode);

  useEffect(() => {
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeClass('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);
}
