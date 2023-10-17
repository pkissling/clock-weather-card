import { html, type TemplateResult } from 'lit'
import * as Sentry from '@sentry/browser'

export function safeRender<T> (renderFn: () => T): T | TemplateResult {
  try {
    return renderFn()
  } catch (e) {
    Sentry.captureException(e)
    console.error('clock-weather-card - Error while rendering clock-weather-card component:', e)
    return html``
  }
}
