import { css, html, type TemplateResult } from 'lit'

export const iconButton = (icon: string, label: string, action: () => void, disabled = false): TemplateResult => html`
  <button class="icon-button" .disabled=${disabled} aria-label=${label} title=${label} @click=${action}>
    <ha-icon icon=${icon}></ha-icon>
  </button>
`

export const textButton = (icon: string, label: string, action: () => void, subtle = false): TemplateResult => html`
  <button class="text-button ${subtle ? 'subtle' : ''}" @click=${action}><ha-icon icon=${icon}></ha-icon>${label}</button>
`

export const controlStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 8px;
    --cwc-tint: rgba(var(--rgb-primary-color, 3, 169, 244), 0.12);
  }
  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  .label {
    color: var(--secondary-text-color);
    font-size: 0.875em;
  }
  .icon-button {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--secondary-text-color);
    --mdc-icon-size: 18px;
  }
  .icon-button:hover:not(:disabled) {
    background: var(--cwc-tint);
    color: var(--primary-color);
  }
  .icon-button:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .footer {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .text-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px 0 10px;
    border: none;
    border-radius: 18px;
    background: var(--cwc-tint);
    color: var(--primary-color);
    font-weight: 500;
    --mdc-icon-size: 18px;
  }
  .text-button.subtle {
    background: none;
    color: var(--secondary-text-color);
  }
  .text-button:hover {
    filter: brightness(1.1);
  }
  .slider {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-bottom: 12px;
  }
  .slider-label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
  }
  .slider-label span {
    flex: 1;
    text-align: end;
    color: var(--secondary-text-color);
    font-variant-numeric: tabular-nums;
  }
  .slider input {
    width: 100%;
    margin: 0;
    accent-color: var(--primary-color);
  }
`
