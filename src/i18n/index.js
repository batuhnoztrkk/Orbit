const DICTS = {
  en: { next: 'Next', prev: 'Back', close: 'Close', ok: 'OK', cancel: 'Cancel', title: 'Tour' },
  tr: { next: 'İleri', prev: 'Geri', close: 'Kapat', ok: 'Tamam', cancel: 'İptal', title: 'Tur' },
  de: { next: 'Weiter', prev: 'Zurück', close: 'Schließen', ok: 'OK', cancel: 'Abbrechen', title: 'Tour' },
  fr: { next: 'Suivant', prev: 'Précédent', close: 'Fermer', ok: 'OK', cancel: 'Annuler', title: 'Visite' }
};

/**
 * Otomatik dil tespiti (navigator.language → 'en', 'tr', ...)
 */
export function detectLocale() {
  if (typeof navigator === 'undefined') return 'en';
  const lang = (navigator.language || 'en').toLowerCase();
  const base = lang.split('-')[0];
  return DICTS[base] ? base : 'en';
}

/**
 * i18n provider: locale + messages override ile translator döndürür.
 * @param {{ locale?: string, messages?: Record<string, Record<string,string>> }} cfg
 */
export function createI18n(cfg = {}) {
  const locale = cfg.locale || detectLocale();
  const merged = { ...DICTS, ...(cfg.messages || {}) };
  const table = merged[locale] || DICTS.en;

  const t = (key, fallback) => (table[key] ?? fallback ?? key);
  return { t, locale };
}
