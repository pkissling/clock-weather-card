import { html, TemplateResult } from "lit";

export function safeRender<T>(renderFn: () => T): T | TemplateResult {
  try {
    return renderFn()
  } catch (e) {
    console.error('clock-weather-card - Error while rendering clock-weather-card component:', e)
      setTimeout(() => {safeRender(renderFn)}, 100)
    // Return an empty TemplateResult for now
    return html``
  }
}
