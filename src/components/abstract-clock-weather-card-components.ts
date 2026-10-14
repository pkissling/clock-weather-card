import { LitElement } from 'lit'

abstract class AbstractClockWeatherCardComponent extends LitElement {

  protected createRenderRoot(): HTMLElement {
    return this
  }
}

export default AbstractClockWeatherCardComponent
