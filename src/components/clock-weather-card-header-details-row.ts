import '@/components/segments/clock-weather-card-entity-segment'
import '@/components/segments/clock-weather-card-template-segment'
import '@/components/segments/clock-weather-card-weather-segment'

import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { property } from 'lit/decorators.js'
import type { DateTime } from 'luxon'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { renderIconSegment } from '@/components/segments/clock-weather-card-weather-icon-segment'
import type { RowConfig, SegmentConfig } from '@/types'
import { customElement } from '@/utils/custom-element'
import { DEFAULT_DATE_PATTERN, DEFAULT_TIME_PATTERN } from '@/utils/luxon'

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
      return html`<clock-weather-card-time-segment><span>${this.currentDate.toFormat(segment.time_pattern || DEFAULT_TIME_PATTERN)}</span></clock-weather-card-time-segment>`
    case 'date':
      return html`<clock-weather-card-date-segment><span>${this.currentDate.toFormat(segment.date_pattern || DEFAULT_DATE_PATTERN)}</span></clock-weather-card-date-segment>`
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
    case 'icon':
      return renderIconSegment(segment.icon)
    case 'weather_icon':
      return html`<clock-weather-card-weather-icon-segment
          .entityId=${segment.entity_id}
        ></clock-weather-card-weather-icon-segment>`
    case 'text':
      return html`<clock-weather-card-text-segment><span>${segment.text}</span></clock-weather-card-text-segment>`
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
