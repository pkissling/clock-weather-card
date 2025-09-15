import { LitElement } from 'lit'

import { isDev } from '@/utils/development'

abstract class AbstractClockWeatherCardComponent extends LitElement {

  public constructsComponentName(): String {
    return this.getComponentName() + (isDev ? '-dev' : '')
  }

  protected createRenderRoot(): Element | ShadowRoot {
    // do not create a shadow DOM for given component
    return this
  }

  protected abstract getComponentName(): String
}

export default AbstractClockWeatherCardComponent
