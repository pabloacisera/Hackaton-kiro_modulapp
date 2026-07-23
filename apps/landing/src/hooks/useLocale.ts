import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type Locale = 'es' | 'en';

/**
 * TASK-i18n-2: useLocale hook — detection + persistence.
 * Reads from i18next (which detects from localStorage → navigator).
 * Exposes setLocale to change and persist.
 */
export function useLocale() {
  const { i18n } = useTranslation();

  const locale = (i18n.language?.startsWith('en') ? 'en' : 'es') as Locale;

  const setLocale = useCallback(
    (lang: Locale) => {
      i18n.changeLanguage(lang);
      try {
        localStorage.setItem('locale', lang);
      } catch {
        /* ignore storage errors */
      }
    },
    [i18n],
  );

  return { locale, setLocale };
}
