import { html, TemplateResult } from "lit";

export async function safeRender<T>(renderFn: () => T): Promise<T | TemplateResult> {
  let numRetries = 3;
  while (numRetries > 0) {
    try {
      return renderFn();
    } catch (e) {
      if (--numRetries === 0) {
        console.error('clock-weather-card - Error while rendering clock-weather-card component:', e);
        return html``;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
  }
}
