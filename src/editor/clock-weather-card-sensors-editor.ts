import type { HomeAssistant } from 'custom-card-helpers'
import { css, html, LitElement, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'

import { controlStyles, iconButton, textButton } from '@/editor/controls'
import { SENSOR_ENTITY_FIELDS } from '@/editor/fields'
import { editorT, fireEvent, renderForm } from '@/editor/form'
import type { ClockWeatherCardConfig, SensorEntityConfig } from '@/types'
import { customElement } from '@/utils/custom-element'

const move = <T>(list: T[], from: number, to: number): T[] => {
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

@customElement('clock-weather-card-sensors-editor')
export class ClockWeatherCardSensorsEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public config!: ClockWeatherCardConfig
  @property({ attribute: false }) public entities: SensorEntityConfig[] = []

  private t(key: string): string {
    return editorT(this.hass, key)
  }

  private _emit(entities: SensorEntityConfig[]): void {
    fireEvent(this, 'entities-changed', entities)
  }

  protected render(): TemplateResult {
    return html`
      <div class="label">${this.t('fields.entities')}</div>
      ${this.entities.map((item, i) => this._renderItem(item, i))}
      <div class="footer">
        ${textButton('mdi:plus', this.t('actions.add_sensor'), () => this._emit([...this.entities, { entity: '' }]))}
      </div>
    `
  }

  private _renderItem(item: SensorEntityConfig, index: number): TemplateResult {
    const last = this.entities.length - 1
    const ctx = { hass: this.hass, config: this.config }
    return html`
      <div class="item" data-sensor=${index}>
        <div class="item-head">
          <span class="item-title">${this.t('sensor')} ${index + 1}</span>
          ${iconButton('mdi:arrow-up', this.t('actions.move_up'), () => this._emit(move(this.entities, index, index - 1)), index === 0)}
          ${iconButton('mdi:arrow-down', this.t('actions.move_down'), () => this._emit(move(this.entities, index, index + 1)), index === last)}
          ${iconButton('mdi:delete-outline', this.t('actions.delete'), () => this._emit(this.entities.filter((_, i) => i !== index)))}
        </div>
        ${renderForm(ctx, SENSOR_ENTITY_FIELDS, item as unknown as Record<string, unknown>, {}, (changes) => {
    const next = { ...item, ...changes } as Record<string, unknown>
    for (const [k, v] of Object.entries(next)) if (v === undefined || v === null) delete next[k]
    this._emit(this.entities.map((e, i) => i === index ? next as unknown as SensorEntityConfig : e))
  })}
      </div>
    `
  }

  static styles = [controlStyles, css`
    .item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 12px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
    }
    .item-head {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .item-title {
      flex: 1;
      font-weight: 500;
    }
  `]
}
