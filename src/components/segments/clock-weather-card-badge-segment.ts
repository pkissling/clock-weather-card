import type { TemplateResult } from 'lit'
import { html } from 'lit'
import { property } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'

import { ClockWeatherCardEntitySegment } from '@/components/segments/clock-weather-card-entity-segment'
import hassService from '@/service/hass-service'
import { bandColor, contrastTextColor, toNumber } from '@/utils/badge'
import { customElement } from '@/utils/custom-element'

// The entity segment's value on a background picked by thresholds of that value.
@customElement('clock-weather-card-badge-segment')
class ClockWeatherCardBadgeSegment extends ClockWeatherCardEntitySegment {
  @property({ attribute: false }) public backgroundColor!: Record<number, string>
  @property() public textColor?: string

  public render (): TemplateResult {
    const value = this.attribute
      ? hassService.getEntityAttribute(this.hass, this.entityId, this.attribute)
      : hassService.getEntityState(this.hass, this.entityId)
    const background = bandColor(this.backgroundColor, toNumber(value))
    if (background === null) return super.render()
    const color = this.textColor ?? contrastTextColor(background) ?? undefined
    return html`<span class="badge" style=${styleMap({ backgroundColor: background, color })}>${super.render()}</span>`
  }
}

export default ClockWeatherCardBadgeSegment
