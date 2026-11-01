import '@/editor/clock-weather-card-color-picker'

import type { HomeAssistant } from 'custom-card-helpers'
import { css, html, LitElement, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import { controlStyles, iconButton, textButton } from '@/editor/controls'
import { editorT, fireEvent } from '@/editor/form'
import { customElement } from '@/utils/custom-element'
import { type ColorStop, DEFAULT_GRADIENT, normalizeGradient } from '@/utils/gradient'

@customElement('clock-weather-card-gradient-editor')
export class ClockWeatherCardGradientEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public gradient: Record<string, string> = DEFAULT_GRADIENT
  // Without a default there is nothing to reset to.
  @property({ attribute: false }) public defaultGradient?: Record<string, string> = DEFAULT_GRADIENT
  @property() public label?: string
  // Each color holds until the next stop instead of blending into it, as for badge thresholds.
  @property({ type: Boolean }) public stepped = false

  private _emit(stops: ColorStop[]): void {
    fireEvent(this, 'gradient-changed', Object.fromEntries(stops.map(s => [String(s.temp), s.color])))
  }

  protected render(): TemplateResult {
    const stops = normalizeGradient(this.gradient)
    const min = stops[0]?.temp ?? 0
    const span = (stops[stops.length - 1]?.temp ?? 0) - min || 1
    const pct = (t: number): number => (t - min) / span * 100
    const t = (key: string): string => editorT(this.hass, key)
    const label = this.label ?? t('fields.gradient')
    const preview = stops.map((s, i) => this.stepped ? `${s.color} ${pct(s.temp)}% ${i < stops.length - 1 ? pct(stops[i + 1].temp) : 100}%` : `${s.color} ${pct(s.temp)}%`)
    const replace = (i: number, stop: ColorStop): void => this._emit(stops.map((s, j) => j === i ? stop : s))
    return html`
      <div class="label">${label}</div>
      <div class="preview">
        <div class="bar" style="background: linear-gradient(to right, ${preview.join(', ')})"></div>
        ${stops.map(s => html`<span class="tick" style="left: ${pct(s.temp)}%">${s.temp}</span>`)}
      </div>
      <div class="stops">
        ${stops.map((stop, i) => html`
          <div class="stop" data-stop=${stop.temp}>
            <input
              class="value"
              type="number"
              step="any"
              aria-label=${label}
              .value=${String(stop.temp)}
              @change=${(e: Event) => {
    const value = (e.target as HTMLInputElement).valueAsNumber
    if (Number.isFinite(value)) replace(i, { ...stop, temp: value })
  }}
            />
            <clock-weather-card-color-picker
              .hass=${this.hass}
              .accessibleName=${`${label} ${stop.temp}`}
              .value=${stop.color}
              @color-changed=${(e: CustomEvent<string | null>) => { e.stopPropagation(); if (e.detail) replace(i, { ...stop, color: e.detail }) }}
            ></clock-weather-card-color-picker>
            ${iconButton('mdi:close', t('actions.delete'), () => this._emit(stops.filter((_, j) => j !== i)), stops.length <= 2)}
          </div>
        `)}
      </div>
      <div class="footer">
        ${textButton('mdi:plus', t('actions.add_stop'), () => {
    const last = stops[stops.length - 1]
    this._emit([...stops, { temp: (last?.temp ?? 0) + 10, color: last?.color ?? '#ffffff' }])
  })}
        ${!this.defaultGradient || this.gradient === this.defaultGradient ? nothing : textButton('mdi:restore', t('actions.reset'), () => this._emit(normalizeGradient(this.defaultGradient!)), true)}
      </div>
    `
  }

  static styles = [controlStyles, css`
    .preview {
      position: relative;
      margin: 0 12px 18px;
    }
    .bar {
      height: 12px;
      border-radius: 6px;
    }
    .tick {
      position: absolute;
      top: 16px;
      transform: translateX(-50%);
      color: var(--secondary-text-color);
      font-size: 0.75em;
    }
    .stops {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .stop {
      display: grid;
      grid-template-columns: 72px 1fr 32px;
      align-items: start;
      gap: 8px;
    }
    .value {
      min-width: 0;
      height: 40px;
      padding: 0 10px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: none;
      color: var(--primary-text-color);
      font: inherit;
    }
    .value:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .stop .icon-button {
      margin-top: 4px;
    }
  `]
}
