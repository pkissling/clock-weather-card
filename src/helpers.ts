import { html, TemplateResult } from "lit";

export function safeRender<T>(renderFn: () => T): T | TemplateResult {
  try {
    return renderFn()
  } catch (e) {
    console.error('Error while rendering clock-weather-card component:', e)
    return html``
  }
}