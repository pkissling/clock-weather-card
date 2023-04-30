import { html, TemplateResult } from "lit";

export function safeRender<T>(renderFn: () => T): T | TemplateResult {
 let retries = 3
  while (retries > 0) {
    try {
      return renderFn()
    } catch (e) {
      console.error('clock-weather-card - Error while rendering clock-weather-card component:', e)
      retries--
    }
  }
  return html``
}
