import { useAppSelector } from '../store/hooks';
import { translations, type TranslationKey } from '../utils/i18n';

export function useTranslation() {
  const lang = useAppSelector((s) => s.language.current);
  const t = (key: TranslationKey, values?: Record<string, string | number>): string => {
    let text: string = translations[lang][key] ?? translations.en[key];
    for (const [name, value] of Object.entries(values ?? {})) {
      text = text.replace(`{${name}}`, String(value));
    }
    return text;
  };
  return { t, lang };
}
