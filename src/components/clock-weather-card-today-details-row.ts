import '@/components/segments/clock-weather-card-date-segment'
import '@/components/segments/clock-weather-card-entity-segment'
import '@/components/segments/clock-weather-card-icon-segment'
import '@/components/segments/clock-weather-card-spacer-segment'
import '@/components/segments/clock-weather-card-time-segment'
import '@/components/segments/clock-weather-card-weather-segment'

import type { HomeAssistant } from 'custom-card-helpers'
import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { DEFAULT_DATE_PATTERN, DEFAULT_TIME_PATTERN } from '@/constants'
import type { MergedClockWeatherCardConfig, RowConfig, SegmentConfig } from '@/types'

@customElement('clock-weather-card-today-details-row')
class ClockWeatherCardTodayDetailsRow extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public config!: MergedClockWeatherCardConfig
  @property({ attribute: false }) public rowConfig!: RowConfig
  @property({ attribute: false }) public currentDate!: Date

  public render (): TemplateResult {
    return html`${this.rowConfig.segments.map(seg => this.renderSegment(seg))}`
  }

  private renderSegment (segment: SegmentConfig): TemplateResult {
    switch (segment.type) {
    case 'time':
      return html`<clock-weather-card-time-segment
          .hass=${this.hass}
          .currentDate=${this.currentDate}
          .pattern=${segment.time_pattern ?? DEFAULT_TIME_PATTERN}
        ></clock-weather-card-time-segment>`
    case 'date':
      return html`<clock-weather-card-date-segment
          .hass=${this.hass}
          .currentDate=${this.currentDate}
          .pattern=${segment.date_pattern ?? DEFAULT_DATE_PATTERN}
        ></clock-weather-card-date-segment>`
    case 'weather':
      return html`<clock-weather-card-weather-segment
          .hass=${this.hass}
          .entity=${this.config.entity}
          .attribute=${segment.attribute}
          .showUnit=${segment.show_unit ?? true}
        ></clock-weather-card-weather-segment>`
    case 'entity':
      return html`<clock-weather-card-entity-segment
          .hass=${this.hass}
          .entityId=${segment.entity_id}
          .attribute=${segment.attribute}
          .showUnit=${segment.show_unit ?? true}
          .unitAttribute=${segment.unit_attribute}
        ></clock-weather-card-entity-segment>`
    case 'icon':
      return html`<clock-weather-card-icon-segment
          .icon=${segment.icon}
        ></clock-weather-card-icon-segment>`
    case 'spacer':
      return html`<clock-weather-card-spacer-segment></clock-weather-card-spacer-segment>`
    }
  }
}

export default ClockWeatherCardTodayDetailsRow
