import '@/components/segments/clock-weather-card-badge-segment'
import '@/components/segments/clock-weather-card-date-segment'
import '@/components/segments/clock-weather-card-entity-segment'
import '@/components/segments/clock-weather-card-icon-segment'
import '@/components/segments/clock-weather-card-spacer-segment'
import '@/components/segments/clock-weather-card-template-segment'
import '@/components/segments/clock-weather-card-text-segment'
import '@/components/segments/clock-weather-card-time-segment'
import '@/components/segments/clock-weather-card-weather-icon-segment'
import '@/components/segments/clock-weather-card-weather-segment'

import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { property } from 'lit/decorators.js'
import type { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import type { RowConfig, SegmentConfig } from '@/types'
import { customElement } from '@/utils/custom-element'

@customElement('clock-weather-card-header-details-row')
class ClockWeatherCardHeaderDetailsRow extends AbstractClockWeatherCardComponent {
  @property({ attribute: false }) public rowConfig!: RowConfig
  @property({ attribute: false }) public currentDate!: DateTime

  public render (): TemplateResult {
    return html`${this.rowConfig.segments.map(seg => this.renderSegment(seg))}`
  }

  private renderSegment (segment: SegmentConfig): TemplateResult {
    switch (segment.type) {
    case 'time':
      return html`<clock-weather-card-time-segment
          .currentDate=${this.currentDate}
          .timePattern=${segment.time_pattern}
        ></clock-weather-card-time-segment>`
    case 'date':
      return html`<clock-weather-card-date-segment
          .currentDate=${this.currentDate}
          .datePattern=${segment.date_pattern}
        ></clock-weather-card-date-segment>`
    case 'weather':
      return html`<clock-weather-card-weather-segment
          .attribute=${segment.attribute}
          .showUnit=${segment.show_unit ?? true}
          .unit=${segment.unit}
          .unitAttribute=${segment.unit_attribute}
        ></clock-weather-card-weather-segment>`
    case 'entity':
      return html`<clock-weather-card-entity-segment
          .entityId=${segment.entity_id}
          .attribute=${segment.attribute}
          .showUnit=${segment.show_unit ?? true}
          .unit=${segment.unit}
          .unitAttribute=${segment.unit_attribute}
        ></clock-weather-card-entity-segment>`
    case 'badge':
      return html`<clock-weather-card-badge-segment
          .entityId=${segment.entity_id}
          .attribute=${segment.attribute}
          .showUnit=${segment.show_unit ?? true}
          .unit=${segment.unit}
          .unitAttribute=${segment.unit_attribute}
          .backgroundColor=${segment.background_color}
          .textColor=${segment.text_color}
        ></clock-weather-card-badge-segment>`
    case 'icon':
      return html`<clock-weather-card-icon-segment
          .icon=${segment.icon}
          .entityId=${segment.entity_id}
        ></clock-weather-card-icon-segment>`
    case 'weather_icon':
      return html`<clock-weather-card-weather-icon-segment
          .entityId=${segment.entity_id}
        ></clock-weather-card-weather-icon-segment>`
    case 'text':
      return html`<clock-weather-card-text-segment
          .text=${segment.text}
        ></clock-weather-card-text-segment>`
    case 'template':
      return html`<clock-weather-card-template-segment
          .template=${segment.template}
        ></clock-weather-card-template-segment>`
    case 'spacer':
      return html`<clock-weather-card-spacer-segment></clock-weather-card-spacer-segment>`
    }
  }
}

export default ClockWeatherCardHeaderDetailsRow
