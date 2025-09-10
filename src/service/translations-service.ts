import { CrowdinApi } from '@/api/crowdin-api'
import logger from '@/service/logger'
import * as en from '@/translations/en.json'

class TranslationsService {
  private crowdinApi: CrowdinApi
  private languageMappings: Map<string, string> | null = null
  private languageFileName = 'clock-weather-card.json'
  private initialized = false

  constructor() {
    this.crowdinApi = new CrowdinApi('06f24835cc7c298da8f1d8a410e')
  }

  private async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    const manifest = await this.crowdinApi.fetchManifest()
    this.languageMappings = this.toLanguageMappings(manifest.content)
    console.log('languageMappings', this.languageMappings)
    this.initialized = true
  }

  public async fetchTranslation(language: string, key: string): Promise<string> {
    await this.initialize()

    const targetLanguagePath = this.languageMappings?.get(language)
    console.log('targetLanguagePath', targetLanguagePath)
    if (targetLanguagePath) {
      const translations = await this.fetchAllTranslationsOfLanguage(targetLanguagePath)
      if (translations[key]) {
        return translations[key]
      }
      logger.warn(`Translation for key "${key}" not found in language "${language}"`)
    }

    if (en[key]) {
      return en[key]
    }
    logger.warn(`Translation for key "${key}" not found in default language (English).`)
    return key
  }

  public async fetchAllTranslationsOfLanguage(path: string): Promise<Record<string, string>> {
    const translations = await this.crowdinApi.fetchTranslations(path)
    return this.flattenTranslations(translations)
  }

  private toLanguageMappings(content: Record<string, object>): Map<string, string> {
    return Object.keys(content).reduce((acc, lang) => {
      const files = content[lang]
      if (Array.isArray(files)) {
        const file = files.find((file) => file.endsWith(this.languageFileName))
        if (file) {
          acc.set(lang, file)
        }
      }
      return acc
    }, new Map<string, string>())
  }

  private flattenTranslations(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'string') {
        acc[newKey] = value
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(acc, this.flattenTranslations(value as Record<string, unknown>, newKey))
      }

      return acc
    }, {} as Record<string, string>)
  }
}

export default new TranslationsService()
