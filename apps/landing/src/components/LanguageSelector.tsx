import { useLocale, Locale } from '../hooks/useLocale';

/**
 * TASK-i18n-3: Language selector in landing header.
 */
export function LanguageSelector() {
  const { locale, setLocale } = useLocale();

  const options: { value: Locale; label: string }[] = [
    { value: 'es', label: 'ES' },
    { value: 'en', label: 'EN' },
  ];

  return (
    <div className="flex gap-1" role="group" aria-label="Language selector">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setLocale(opt.value)}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            locale === opt.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          aria-pressed={locale === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
