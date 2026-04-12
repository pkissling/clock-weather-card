import { LitElement } from 'lit'
import { type StaticValue, unsafeStatic } from 'lit/static-html.js'

import { customElementName } from '@/utils/development'

abstract class AbstractClockWeatherCardComponent extends LitElement {

  protected static getCustomElementName(): string {
    throw new Error('getCustomElementName() must be overridden by subclass')
  }

  static get customElementName(): string {
    return customElementName(this.getCustomElementName())
  }

  static get tag(): StaticValue {
    return unsafeStatic(this.customElementName)
  }

  protected createRenderRoot(): Element | ShadowRoot {
    // do not create a shadow DOM for given component
    return this
  }
}

export default AbstractClockWeatherCardComponent
