import '@/components/clock-weather-card-error'
import '@/components/clock-weather-card-header'
import '@/components/clock-weather-card-forecast-strip'
import '@/components/clock-weather-card-forecast-list'

import { provide } from '@lit/context'
import { deepEqual, type HomeAssistant } from 'custom-card-helpers'
import type { CSSResultGroup, PropertyValues, TemplateResult } from 'lit'
import { LitElement, nothing } from 'lit'
import { html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { DateTime } from 'luxon'

import { configContext, errorMessageContext, hassContext } from '@/context'
import logger from '@/service/logger'
import styles from '@/styles'
import type { ClockHandle, ClockWeatherCardConfig, ResolvedConfig } from '@/types'
import { resolveConfig } from '@/utils/config'
import { isDev } from '@/utils/development'
import { requiredConfigMissing } from '@/utils/errors'
import { configNeedsSeconds, startClock } from '@/utils/luxon'

// eslint-disable-next-line no-restricted-imports
import { version } from '../package.json'

// This puts your card into the UI card picker dialog
window.customCards = window.customCards || []
window.customCards.push({
  type: 'clock-weather-card',
  name: 'Clock Weather Card',
  description: 'Shows the current date/time in combination with the current weather and an iOS insipired weather forecast.',
  preview: true,
  documentationURL: 'https://github.com/pkissling/clock-weather-card',
  getEntitySuggestion: (_hass, entityId) => entityId.startsWith('weather.')
    ? { config: { type: 'custom:clock-weather-card', entity: entityId } }
    : null
})

// eslint-disable-next-line no-console
console.info(
  `%c  CLOCK-WEATHER-CARD \n%c Version: ${isDev ? 'DEV' : version}`,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
)

@customElement('clock-weather-card')
export class ClockWeatherCard extends LitElement {
  @provide({ context: hassContext }) @property({ attribute: false }) public hass!: HomeAssistant
  @provide({ context: errorMessageContext }) @property({ type: Boolean }) public preview = false
  @state() private config?: ClockWeatherCardConfig
  @provide({ context: configContext }) @state() private resolved?: ResolvedConfig
  @state() private error?: string
  @state() private currentDate: DateTime = DateTime.now()
  private _clock: ClockHandle | null = null

  protected render(): TemplateResult {
    if (!this.hass || !this.config) {
      // TODO
      return html`<ha-card><h1>Loading...</h1></ha-card>`
    }

    if (!this.resolved) {
      return html`
        <clock-weather-card-error
          .message=${this.error}
          .config=${this.config}
        ></clock-weather-card-error>
      `
    }

    const { title, header, forecastStrip, forecastList } = this.resolved
    const tapAction = this.config.tap_action
    const clickable = !!tapAction && tapAction.action !== 'none'
    return html`
      <ha-card
        class=${clickable ? 'clickable' : ''}
        role=${clickable ? 'button' : nothing}
        tabindex=${clickable ? 0 : nothing}
        @click=${clickable ? this.handleTap : nothing}
        @keydown=${clickable ? (e: KeyboardEvent) => { if (e.key === 'Enter') this.handleTap() } : nothing}
      >
        ${title ? html`<h1 class="card-header">${title}</h1>` : ''}
        <div class="card-content">
          ${header.hidden ? '' : html`
            <clock-weather-card-header .currentDate=${this.currentDate}></clock-weather-card-header>
          `}
          ${forecastStrip.hidden ? '' : html`
            <clock-weather-card-forecast-strip .currentDate=${this.currentDate}></clock-weather-card-forecast-strip>
          `}
          ${forecastList.hidden ? '' : html`
            <clock-weather-card-forecast-list .currentDate=${this.currentDate}></clock-weather-card-forecast-list>
          `}
        </div>
      </ha-card>
      `
  }

  private handleTap(): void {
    this.dispatchEvent(new CustomEvent('hass-action', {
      bubbles: true,
      composed: true,
      detail: { config: { entity: this.config?.entity, tap_action: this.config?.tap_action }, action: 'tap' },
    }))
  }

  public setConfig(config: ClockWeatherCardConfig): void {
    if (!config?.entity) {
      throw requiredConfigMissing('entity')
    }
    this.config = config
  }

  public static getStubConfig (_: HomeAssistant, entities: string[], entitiesFallback: string[]): Omit<ClockWeatherCardConfig, 'type'> {
    const isWeather = (e: string): boolean => e.startsWith('weather.')
    const entity = entities.find(isWeather) ?? entitiesFallback.find(isWeather)
    if (!entity) logger.warn('No weather entity found for the stub config')
    return { entity }
  }

  public connectedCallback(): void {
    super.connectedCallback()
    this._tryStart()
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback()
    this._stopClock()
  }

  public willUpdate(changed: PropertyValues): void {
    if (!changed.has('config') && !changed.has('hass')) return
    const previous = this.resolved
    this._resolveConfig()
    // A new resolved config can change the tick interval (HH:mm vs HH:mm:ss), locale or time zone - restart.
    if (this.resolved !== previous) this._stopClock()
    this._tryStart()
  }

  private _resolveConfig(): void {
    if (!this.hass || !this.config) return
    try {
      const next = resolveConfig(this.config, this.hass)
      // Keep the previous object when nothing changed so config consumers don't re-render on every hass update.
      if (!deepEqual(next, this.resolved)) {
        logger.debug('Resolved config', next)
        this.resolved = next
      }
      this.error = undefined
    } catch (e) {
      this.resolved = undefined
      this.error = e instanceof Error ? e.message : String(e)
      logger.warn(`Invalid config: ${this.error}`)
    }
  }

  // Idempotent - safe to call from any lifecycle hook.
  private _tryStart(): void {
    if (!this.resolved) return
    if (this._clock === null) {
      const { header, locale, timeZone } = this.resolved
      const needsSeconds = configNeedsSeconds(header)
      logger.debug(`Starting clock with ${needsSeconds ? 'per-second' : 'per-minute'} ticks`)
      this._clock = startClock(needsSeconds, () => {
        this.currentDate = DateTime.now()
          .setLocale(locale)
          .setZone(timeZone)
      })
    }
  }

  private _stopClock(): void {
    if (this._clock) {
      logger.debug('Stopping clock')
      this._clock.stop()
    }
    this._clock = null
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    const { ClockWeatherCardEditor } = await import('@/editor/clock-weather-card-editor')
    return new ClockWeatherCardEditor()
  }

  public static get styles (): CSSResultGroup {
    return styles
  }
}
