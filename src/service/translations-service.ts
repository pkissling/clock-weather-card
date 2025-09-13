import logger from '@/service/logger'

type Translations = Map<string, string>

class TranslationsService {
  private translationsByLang: Map<string, Translations> = new Map()

  constructor() {
    // Eagerly import all locale JSON files at build time (Vite)
    const rawLocales = import.meta.glob('../locales/*.json', { eager: true, import: 'default' }) as Record<string, Record<string, unknown>>

    this.translationsByLang = Object.entries(rawLocales).reduce((acc, [path, data]) => {
      // Extract language code from filename
      const match = path.match(/\/([^/]+)\.json$/)
      if (!match || !match[1]) return acc
      const lang = match[1]
      return acc.set(lang, this.flattenTranslations(data))
    }, new Map<string, Translations>())
  }

  public t(language: string, key: string): string {
    const lang = this.normalizeLang(language)

    const langDict = this.translationsByLang.get(lang)
    if (langDict && langDict.has(key)) return langDict.get(key) as string

    const baseLang = lang.split('-')[0]
    if (baseLang !== lang) {
      const baseLangDict = this.translationsByLang.get(baseLang)
      if (baseLangDict && baseLangDict.has(key)) {
        logger.warn(`Translation for key "${key}" not found for language "${language}", using base language (${baseLang}).`)
        return baseLangDict.get(key) as string
      }
    }

    const enFallback = this.translationsByLang.get('en')
    if (enFallback && enFallback.has(key)) {
      logger.warn(`Translation for key "${key}" not found for language "${language}", using fallback (en).`)
      return enFallback.get(key) as string
    }

    logger.warn(`Translation for key "${key}" not found for language "${language}" nor fallback (en).`)
    return key
  }

  private normalizeLang(language: string): string {
    // Keep lower-case, map underscores to hyphens to match filenames like pt-br, zh-cn
    return language.toLowerCase().replace('_', '-')
  }

  private flattenTranslations(obj: Record<string, unknown>, prefix = ''): Translations {
    const acc: Translations = new Map()
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key
      if (typeof value == 'string') {
        acc.set(newKey, value)
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = this.flattenTranslations(value as Record<string, unknown>, newKey)
        for (const [nKey, nVal] of nested.entries()) acc.set(nKey, nVal)
      }
      return acc
    }, acc)
  }
}

export default new TranslationsService()
