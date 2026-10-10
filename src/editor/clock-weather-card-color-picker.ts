import type { HomeAssistant } from 'custom-card-helpers'
import { css, html, LitElement, nothing, type TemplateResult, unsafeCSS } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import { controlStyles } from '@/editor/controls'
import { editorT, fireEvent } from '@/editor/form'
import { toHex, toRgb } from '@/utils/gradient'

const hueToHex = (hue: number): string => {
  const f = (n: number): number => {
    const k = (n + hue / 30) % 12
    return 255 * (0.55 - 0.45 * Math.max(-1, Math.min(k - 3, 9 - k, 1)))
  }
  return toHex([f(0), f(8), f(4)])
}

// Position of a color on the hue bar; grays and non-hex values like var(--x) have none.
const hueOf = (color: string | undefined): number | null => {
  const rgb = color ? toRgb(color) : null
  if (!rgb) return null
  const [r, g, b] = rgb.map(c => c / 255)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (d === 0) return null
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

@customElement('clock-weather-card-color-picker')
export class ClockWeatherCardColorPicker extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property() public label = ''
  @property({ attribute: false }) public accessibleName?: string
  @property() public value?: string

  private _emit(value: string | undefined): void {
    fireEvent(this, 'color-changed', value)
  }

  private _pickHue(e: PointerEvent): void {
    const bar = e.currentTarget as HTMLElement
    if (e.type === 'pointerdown') bar.setPointerCapture(e.pointerId)
    else if (!bar.hasPointerCapture(e.pointerId)) return
    const { left, width } = bar.getBoundingClientRect()
    this._emit(hueToHex(Math.max(0, Math.min(1, (e.clientX - left) / width)) * 360))
  }

  protected render(): TemplateResult {
    const hue = hueOf(this.value)
    return html`
      ${this.label ? html`<div class="label">${this.label}</div>` : nothing}
      <label class="field">
        <span class="preview" style=${this.value ? `background: ${this.value}` : ''}></span>
        <input
          type="text"
          spellcheck="false"
          aria-label=${this.accessibleName ?? this.label}
          placeholder=${editorT(this.hass, 'default_color')}
          .value=${this.value ?? ''}
          @input=${(e: Event) => {
    const value = (e.target as HTMLInputElement).value.trim()
    // Only empty or complete hex values sync while typing; anything else (e.g. var(--x)) applies on change.
    if (!value) this._emit(undefined)
    else if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) this._emit(value)
  }}
          @change=${(e: Event) => this._emit((e.target as HTMLInputElement).value.trim() || undefined)}
        />
      </label>
      <div
        class="hues"
        role="presentation"
        @pointerdown=${this._pickHue}
        @pointermove=${this._pickHue}
      >${hue === null ? nothing : html`<span class="marker" style="left: ${hue / 3.6}%; background: ${this.value}"></span>`}</div>
    `
  }

  static styles = [controlStyles, css`
    :host {
      gap: 6px;
    }
    .marker {
      position: absolute;
      top: 50%;
      width: 14px;
      height: 14px;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.3);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .hues {
      position: relative;
      height: 14px;
      border-radius: 7px;
      background: linear-gradient(to right, ${unsafeCSS([...Array(13)
    .keys()].map(i => hueToHex(i * 30))
    .join(', '))});
      cursor: crosshair;
      touch-action: none;
    }
    .field {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 40px;
      padding: 0 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }
    .field:focus-within {
      border-color: var(--primary-color);
    }
    .preview {
      flex: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--info-color);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);
    }
    input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: none;
      color: var(--primary-text-color);
      font: inherit;
      font-family: var(--code-font-family, monospace);
    }
  `]
}
