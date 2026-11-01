import type { HomeAssistant } from 'custom-card-helpers'
import { css, html, LitElement, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import { controlStyles } from '@/editor/controls'
import { editorT, fireEvent } from '@/editor/form'
import { customElement } from '@/utils/custom-element'
import { toHex, toRgb } from '@/utils/gradient'

@customElement('clock-weather-card-color-picker')
export class ClockWeatherCardColorPicker extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property() public label = ''
  @property({ attribute: false }) public accessibleName?: string
  @property() public value?: string
  // What applies while no color is set; defaults to the theme's color.
  @property() public placeholder?: string
  @property({ attribute: false }) public placeholderSwatch?: string

  private _emit(value: string | undefined): void {
    fireEvent(this, 'color-changed', value)
  }

  protected render(): TemplateResult {
    const rgb = this.value ? toRgb(this.value) : null
    return html`
      ${this.label ? html`<div class="label">${this.label}</div>` : nothing}
      <div class="field">
        <span class="preview" style=${this.value || this.placeholderSwatch ? `background: ${this.value || this.placeholderSwatch}` : ''}>
          <input
            type="color"
            tabindex="-1"
            aria-hidden="true"
            .value=${rgb ? toHex(rgb) : '#000000'}
            @input=${(e: Event) => this._emit((e.target as HTMLInputElement).value)}
          />
        </span>
        <input
          type="text"
          spellcheck="false"
          aria-label=${this.accessibleName ?? this.label}
          placeholder=${this.placeholder ?? editorT(this.hass, 'default_color')}
          .value=${this.value ?? ''}
          @input=${(e: Event) => {
    const value = (e.target as HTMLInputElement).value.trim()
    // Only empty or complete hex values sync while typing; anything else (e.g. var(--x)) applies on change.
    if (!value) this._emit(undefined)
    else if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) this._emit(value)
  }}
          @change=${(e: Event) => this._emit((e.target as HTMLInputElement).value.trim() || undefined)}
        />
      </div>
    `
  }

  static styles = [controlStyles, css`
    :host {
      gap: 6px;
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
      position: relative;
      flex: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--info-color);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);
    }
    /* The native picker stays invisible so the swatch can also show non-hex colors like var(--x). */
    input[type='color'] {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      padding: 0;
      border: none;
      opacity: 0;
      cursor: pointer;
    }
    input[type='text'] {
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
