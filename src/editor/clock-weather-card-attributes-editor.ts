import '@/editor/clock-weather-card-color-picker'

import type { HomeAssistant } from 'custom-card-helpers'
import { css, html, LitElement, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import { controlStyles, iconButton, move, textButton } from '@/editor/controls'
import { FORECAST_ATTRIBUTES, STRIP_ATTRIBUTE_FIELDS } from '@/editor/fields'
import { attributeLabel, type Data, editorT, fireEvent, renderForm, setIn } from '@/editor/form'
import type { ClockWeatherCardConfig, ForecastStripAttributeConfig } from '@/types'
import { DEFAULT_STRIP_ATTRIBUTES, defaultAttributeColor, defaultAttributeIcon, DEFAULTS } from '@/utils/config'
import { customElement } from '@/utils/custom-element'

// The color has its own picker, so ha-form renders only the other fields.
const FORM_FIELDS = STRIP_ATTRIBUTE_FIELDS.filter(f => f.name !== 'color')

@customElement('clock-weather-card-attributes-editor')
export class ClockWeatherCardAttributesEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public config!: ClockWeatherCardConfig
  @property({ attribute: false }) public entries: ForecastStripAttributeConfig[] = []

  private t(key: string): string {
    return editorT(this.hass, key)
  }

  private _emit(entries: ForecastStripAttributeConfig[]): void {
    fireEvent(this, 'attributes-changed', entries)
  }

  private _updateEntry(index: number, changes: Data): void {
    this._emit(this.entries.map((a, i) => i === index ? setIn(a as unknown as Data, [], changes) as unknown as ForecastStripAttributeConfig : a))
  }

  private _add(): void {
    const unused = FORECAST_ATTRIBUTES.find(a => !this.entries.some(e => e.attribute === a)) ?? FORECAST_ATTRIBUTES[0]
    this._emit([...this.entries, { attribute: unused }])
  }

  protected render(): TemplateResult {
    const weatherIconType = this.config.sections?.forecast_strip?.weather_icon_type ?? this.config.weather_icon_type ?? DEFAULTS.weather_icon_type
    return html`
      <div class="label">${this.t('fields.attributes')}</div>
      ${this.entries.map((entry, i) => this._renderEntry(entry, i, weatherIconType))}
      <div class="footer">
        ${textButton('mdi:plus', this.t('actions.add_attribute'), () => this._add())}
        ${this.entries === DEFAULT_STRIP_ATTRIBUTES ? nothing : textButton('mdi:restore', this.t('actions.reset'), () => this._emit(DEFAULT_STRIP_ATTRIBUTES), true)}
      </div>
    `
  }

  private _renderEntry(entry: ForecastStripAttributeConfig, index: number, weatherIconType: string): TemplateResult {
    const defaultColor = defaultAttributeColor(entry.attribute, weatherIconType) ?? undefined
    const colorLabel = this.t('fields.color')
    return html`
      <div class="row" data-attribute=${index}>
        <div class="row-head">
          <span class="row-title">${attributeLabel(this.hass, entry.attribute)}</span>
          ${iconButton('mdi:arrow-up', this.t('actions.move_up'), () => this._emit(move(this.entries, index, index - 1)), index === 0)}
          ${iconButton('mdi:arrow-down', this.t('actions.move_down'), () => this._emit(move(this.entries, index, index + 1)), index === this.entries.length - 1)}
          ${iconButton('mdi:delete-outline', this.t('actions.delete'), () => this._emit(this.entries.filter((_, i) => i !== index)))}
        </div>
        ${renderForm(
    { hass: this.hass, config: this.config },
    FORM_FIELDS,
          entry as unknown as Data,
          { icon: defaultAttributeIcon(entry.attribute) ?? undefined },
          changes => this._updateEntry(index, changes),
  )}
        <clock-weather-card-color-picker
          .hass=${this.hass}
          .label=${colorLabel}
          .value=${entry.color ?? defaultColor}
          @color-changed=${(e: CustomEvent<string | null>) => { e.stopPropagation(); this._updateEntry(index, { color: e.detail === defaultColor ? undefined : e.detail }) }}
        ></clock-weather-card-color-picker>
      </div>
    `
  }

  static styles = [controlStyles, css`
    .row {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `]
}
