import logger from '@/service/logger'

type Translations = Map<string, string>

class TranslationsService {
  private translationsByLang = new Map<string, Translations>()

  constructor() {
    this.register('', import.meta.glob('../locales/*.json', { eager: true, import: 'default' }))
  }

  public register(namespace: string, locales: Record<string, unknown>): void {
    for (const [path, data] of Object.entries(locales)) {
      const lang = path.match(/\/([^/]+)\.json$/)?.[1]
      if (!lang) continue
      const translations = this.translationsByLang.get(lang) ?? new Map<string, string>()
      this.flatten(data as Record<string, unknown>, namespace, translations)
      this.translationsByLang.set(lang, translations)
    }
  }

  public get languages(): string[] {
    return [...this.translationsByLang.keys()]
  }

  public has(key: string): boolean {
    return this.translationsByLang.get('en')
      ?.has(key) ?? false
  }

  public t(language: string, key: string, fallback?: () => string | undefined): string {
    const lang = this.normalizeLang(language)

    const langDict = this.translationsByLang.get(lang)
    if (langDict?.has(key)) return langDict.get(key)!

    const baseLang = lang.split('-')[0]
    const baseLangDict = this.translationsByLang.get(baseLang)
    if (baseLang !== lang && baseLangDict?.has(key)) return baseLangDict.get(key)!
    const fallbackValue = fallback?.()
    if (fallbackValue) return fallbackValue
    if (!langDict && !baseLangDict) logger.warn(`No translations for language "${language}", falling back to English`)

    const enFallback = this.translationsByLang.get('en')
    if (enFallback?.has(key)) return enFallback.get(key)!

    logger.warn(`Translation for key "${key}" not found for language "${language}" nor fallback (en).`)
    return key
  }

  private normalizeLang(language: string): string {
    // Unicode extensions (-u-hc-h23) are not part of the locale file names.
    return language.toLowerCase()
      .split('-u-')[0]
      .replace('_', '-')
  }

  private flatten(obj: Record<string, unknown>, prefix: string, into: Translations): void {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key
      if (typeof value === 'string') into.set(path, value)
      else if (value && typeof value === 'object') this.flatten(value as Record<string, unknown>, path, into)
    }
  }
}

export default new TranslationsService()
