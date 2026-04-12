import { LitElement } from 'lit'

abstract class AbstractClockWeatherCardComponent extends LitElement {

  protected createRenderRoot(): Element | ShadowRoot {
    // do not create a shadow DOM for given component
    return this
  }
}

export default AbstractClockWeatherCardComponent
