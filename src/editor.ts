import { LitElement, html, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { type HomeAssistant, type LovelaceCardEditor } from 'custom-card-helpers'
import { type ClockWeatherCardConfig } from './types'

/** HA Lovelace UI editor for clock-weather-card. */
@customElement('clock-weather-card-editor')
export class ClockWeatherCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant

  @state() private _config!: ClockWeatherCardConfig

  public setConfig (config: ClockWeatherCardConfig): void {
    this._config = config
  }

  private _valueChanged (ev: CustomEvent): void {
    if (!this._config || !this.hass) return
    const newConfig = ev.detail.value as ClockWeatherCardConfig
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    }))
  }

  protected render (): TemplateResult {
    if (!this._config) return html``

    // Schema for ha-form – mirrors ClockWeatherCardConfig options.
    const schema = [
      {
        name: 'entity',
        required: true,
        selector: { entity: { domain: 'weather' } }
      },
      {
        name: 'title',
        selector: { text: {} }
      },
      // ── Today section ────────────────────────────────────────────────────
      {
        name: 'clock_font_size',
        selector: { number: { min: 1, max: 8, step: 0.5, mode: 'slider' } }
      },
      {
        name: 'time_format',
        selector: {
          select: {
            options: [
              { value: '24', label: '24-Stunden' },
              { value: '12', label: '12-Stunden (AM/PM)' }
            ]
          }
        }
      },
      {
        name: 'weather_icon_type',
        selector: {
          select: {
            options: [
              { value: 'line', label: 'Linie' },
              { value: 'fill', label: 'Gefüllt' }
            ]
          }
        }
      },
      {
        name: 'animated_icon',
        selector: { boolean: {} }
      },
      {
        name: 'hide_clock',
        selector: { boolean: {} }
      },
      {
        name: 'hide_date',
        selector: { boolean: {} }
      },
      {
        // Luxon format tokens: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
        // 'D' = locale-aware short date; 'cccc' = full weekday; 'dd'/'MM' = zero-padded day/month
        name: 'date_pattern',
        selector: {
          select: {
            custom_value: true,
            options: [
              { value: 'D', label: 'Lokal (z.B. 2.4.2026 / 4/2/2026)' },
              { value: 'dd.MM.yyyy', label: '02.04.2026' },
              { value: 'cccc, dd.MM.yyyy', label: 'Donnerstag, 02.04.2026' },
              { value: 'ccc, dd.MM.yyyy', label: 'Do, 02.04.2026' },
              { value: 'MM/dd/yyyy', label: '04/02/2026 (US)' },
              { value: 'cccc, MM/dd/yyyy', label: 'Thursday, 04/02/2026 (US)' },
              { value: 'DD', label: 'Apr 2, 2026 (international)' },
              { value: 'cccc, DD', label: 'Thursday, Apr 2, 2026' },
              { value: 'yyyy-MM-dd', label: '2026-04-02 (ISO)' }
            ]
          }
        }
      },
      {
        name: 'hide_today_section',
        selector: { boolean: {} }
      },
      // ── Forecast section ─────────────────────────────────────────────────
      {
        name: 'forecast_rows',
        selector: { number: { min: 1, max: 10, step: 1, mode: 'box' } }
      },
      {
        name: 'hourly_forecast',
        selector: { boolean: {} }
      },
      {
        name: 'hide_forecast_section',
        selector: { boolean: {} }
      },
      // ── Sensors ──────────────────────────────────────────────────────────
      {
        name: 'temperature_sensor',
        selector: { entity: { domain: 'sensor' } }
      },
      {
        name: 'humidity_sensor',
        selector: { entity: { domain: 'sensor' } }
      },
      {
        name: 'show_humidity',
        selector: { boolean: {} }
      },
      {
        name: 'show_decimal',
        selector: { boolean: {} }
      }
    ]

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${schema}
        .computeLabel=${this._computeLabel}
        @value-changed=${(ev: CustomEvent) => { this._valueChanged(ev) }}
      ></ha-form>
    `
  }

  // Label lookup for each schema field (static arrow fn → no bind() needed).
  private readonly _computeLabel = (schemaEntry: { name: string }): string => {
    const labels: Record<string, string> = {
      entity: 'Wetter-Entität',
      title: 'Titel (optional)',
      clock_font_size: 'Uhr-Schriftgröße (rem)',
      time_format: 'Zeitformat',
      weather_icon_type: 'Wetter-Icon-Stil',
      animated_icon: 'Animiertes Icon',
      hide_clock: 'Uhr ausblenden',
      hide_date: 'Datum ausblenden',
      date_pattern: 'Datumsformat',
      hide_today_section: 'Heute-Bereich ausblenden',
      forecast_rows: 'Vorhersage-Zeilen',
      hourly_forecast: 'Stündliche Vorhersage',
      hide_forecast_section: 'Vorhersage-Bereich ausblenden',
      temperature_sensor: 'Temperatursensor (optional)',
      humidity_sensor: 'Feuchtigkeitssensor (optional)',
      show_humidity: 'Luftfeuchtigkeit anzeigen',
      show_decimal: 'Temperatur mit Dezimalstellen'
    }
    return labels[schemaEntry.name] ?? schemaEntry.name
  }
}
