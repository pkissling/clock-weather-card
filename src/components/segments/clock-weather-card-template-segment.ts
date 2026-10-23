import { consume } from '@lit/context'
import type { HomeAssistant } from 'custom-card-helpers'
import type { PropertyValues, TemplateResult } from 'lit'
import { html } from 'lit'
import { property, state } from 'lit/decorators.js'

import AbstractClockWeatherCardComponent from '@/components/abstract-clock-weather-card-components'
import { hassContext } from '@/context'
import hassService from '@/service/hass-service'
import logger from '@/service/logger'
import { customElement } from '@/utils/custom-element'

@customElement('clock-weather-card-template-segment')
class ClockWeatherCardTemplateSegment extends AbstractClockWeatherCardComponent {
  @consume({ context: hassContext, subscribe: true }) @state() private hass!: HomeAssistant
  @property() public template!: string
  @state() private result: string | null = null
  private unsubscribe: Promise<(() => Promise<void>) | null> | null = null

  public render (): TemplateResult {
    return this.result === null
      ? html`<span class="skeleton skeleton--text"></span>`
      : html`<span>${this.result}</span>`
  }

  // HA renders the template server-side, so a new hass only matters when its connection changes.
  protected shouldUpdate (changed: PropertyValues): boolean {
    return [...changed.keys()].some(key => key !== 'hass') || this.connectionChanged(changed)
  }

  protected updated (changed: PropertyValues): void {
    if (changed.has('template') || this.connectionChanged(changed)) this.subscribe()
  }

  public connectedCallback (): void {
    super.connectedCallback()
    if (this.hasUpdated) this.subscribe()
  }

  public disconnectedCallback (): void {
    super.disconnectedCallback()
    this.unsubscribeTemplate()
  }

  private connectionChanged (changed: PropertyValues): boolean {
    return changed.has('hass') && (changed.get('hass') as HomeAssistant | undefined)?.connection !== this.hass?.connection
  }

  private subscribe (): void {
    this.unsubscribeTemplate()
    if (!this.hass) return
    const { template } = this
    this.unsubscribe = hassService
      .subscribeTemplate(this.hass, template, event => {
        if ('error' in event) {
          logger.warn(`Template "${template}" failed to render: ${event.error}`)
          this.result ??= ''
        } else this.result = String(event.result ?? '')
      })
      .catch((e: unknown) => {
        logger.error(`Error subscribing to template "${template}"`, e)
        this.result ??= ''
        return null
      })
  }

  private unsubscribeTemplate (): void {
    void this.unsubscribe?.then(async unsubscribe => unsubscribe?.())
      .catch((e: unknown) => logger.debug('Error unsubscribing from template, connection may already be closed', e))
    this.unsubscribe = null
  }
}

export default ClockWeatherCardTemplateSegment
