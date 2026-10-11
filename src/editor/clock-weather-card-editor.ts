import '@/editor/clock-weather-card-rows-editor'
import '@/editor/clock-weather-card-gradient-editor'
import '@/editor/clock-weather-card-color-picker'

import { deepEqual, type HomeAssistant } from 'custom-card-helpers'
import { css, html, LitElement, nothing, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import { CARD_FIELDS, type CardGroup, type EditorField, SECTION_FIELDS, type SectionKey } from '@/editor/fields'
import { attributeLabel, type Data, editorT, fireEvent, type FormContext, isFormField, renderForm, setIn } from '@/editor/form'
import type { ClockWeatherCardConfig, RowConfig } from '@/types'
import { DEFAULT_ROWS, DEFAULTS } from '@/utils/config'
import { DEFAULT_GRADIENT } from '@/utils/gradient'

const SECTION_ICONS: Record<SectionKey, string> = {
  header: 'mdi:clock-time-four-outline',
  forecast_strip: 'mdi:view-column-outline',
  forecast_list: 'mdi:chart-gantt',
}

const GROUP_ICONS: Record<Exclude<CardGroup, 'essentials'>, string> = {
  appearance: 'mdi:palette-outline',
  interaction: 'mdi:gesture-tap',
  region: 'mdi:earth',
}

@customElement('clock-weather-card-editor')
export class ClockWeatherCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant
  @state() private _config?: ClockWeatherCardConfig
  @state() private _openSection?: SectionKey
  @state() private _openGroups = new Set<CardGroup>()

  public setConfig(config: ClockWeatherCardConfig): void {
    this._config = config
  }

  private get ctx(): FormContext {
    return { hass: this.hass!, config: this._config! }
  }

  private t(key: string): string {
    return editorT(this.hass!, key)
  }

  private _update(path: string[], changes: Data): void {
    this._config = setIn(this._config!, path, changes) as ClockWeatherCardConfig
    fireEvent(this, 'config-changed', { config: this._config })
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing
    const groups = ['appearance', 'interaction', 'region'] as const
    return html`
      ${this._renderFields(CARD_FIELDS.filter(f => f.group === 'essentials'), [], this._config, DEFAULTS)}
      <div class="sections">
        ${(Object.keys(SECTION_FIELDS) as SectionKey[]).map(key => this._renderSection(key))}
      </div>
      ${groups.map(group => html`
        <ha-expansion-panel
          outlined
          class="group"
          data-group=${group}
          @expanded-will-change=${(e: CustomEvent<{ expanded: boolean }>) => this._toggleGroup(group, e.detail.expanded)}
        >
          <div slot="header" class="panel-header">
            <ha-icon icon=${GROUP_ICONS[group]}></ha-icon>${this.t(`groups.${group}`)}
          </div>
          ${this._openGroups.has(group) ? this._renderFields(CARD_FIELDS.filter(f => f.group === group), [], this._config!, DEFAULTS) : nothing}
        </ha-expansion-panel>
      `)}
    `
  }

  private _renderSection(key: SectionKey): TemplateResult {
    const section = (this._config!.sections?.[key] ?? {}) as Data
    const hidden = section.hide === true
    const open = this._openSection === key && !hidden
    const fields = SECTION_FIELDS[key]
    const path = ['sections', key]
    const defaults = DEFAULTS.sections[key]
    return html`
      <div class="section ${hidden ? 'hidden' : ''} ${open ? 'open' : ''}" data-section=${key}>
        <div
          class="section-head"
          role="button"
          tabindex="0"
          aria-expanded=${open}
          @click=${() => this._toggleSection(key, hidden)}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._toggleSection(key, hidden) } }}
        >
          <div class="section-icon"><ha-icon icon=${SECTION_ICONS[key]}></ha-icon></div>
          <div class="section-titles">
            <div class="section-name">${this.t(`sections.${key}`)}</div>
            <div class="section-summary">${hidden ? this.t('hidden') : this._summary(key, section)}</div>
          </div>
          <ha-switch
            .checked=${!hidden}
            aria-label=${this.t('show_section')}
            @click=${(e: Event) => e.stopPropagation()}
            @change=${(e: Event) => this._update(path, { hide: (e.target as HTMLInputElement).checked ? undefined : true })}
          ></ha-switch>
          <ha-icon class="chevron" icon="mdi:chevron-down"></ha-icon>
        </div>
        ${open ? html`
          <div class="section-body">
            ${this._renderFields(fields.filter(f => !f.advanced), path, section, defaults)}
            <ha-expansion-panel outlined class="more">
              <div slot="header" class="panel-header"><ha-icon icon="mdi:tune-variant"></ha-icon>${this.t('more_options')}</div>
              ${this._renderFields(fields.filter(f => f.advanced), path, section, defaults)}
            </ha-expansion-panel>
          </div>
        ` : nothing}
      </div>
    `
  }

  private _toggleGroup(group: CardGroup, expanded: boolean): void {
    const groups = new Set(this._openGroups)
    if (expanded) groups.add(group)
    else groups.delete(group)
    this._openGroups = groups
  }

  private _toggleSection(key: SectionKey, hidden: boolean): void {
    if (hidden) return
    this._openSection = this._openSection === key ? undefined : key
  }

  private _summary(key: SectionKey, section: Data): string {
    if (key === 'header') {
      const rows = (section.rows as RowConfig[] | undefined) ?? DEFAULT_ROWS
      const types = [...new Set(rows.flatMap(r => r.segments.map(s => s.type)))].filter(t => t !== 'spacer' && t !== 'icon')
      return types.map(t => this.t(`segments.${t}`))
        .join(' · ')
    }
    const defaults = DEFAULTS.sections[key]
    const type = (section.forecast_type as string | undefined) ?? defaults.forecast_type
    const count = (section.count as number | undefined) ?? defaults.count
    const attribute = (section.attribute as string | undefined) ?? defaults.attribute
    return [this.t(`options.${type}`), `${count} ${this.t('entries')}`, attributeLabel(this.hass!, attribute)].join(' · ')
  }

  // Groups consecutive ha-form fields into one form and renders custom controls in between, keeping field order.
  private _renderFields(fields: EditorField[], path: string[], value: Data, defaults: Data): TemplateResult[] {
    const chunks: EditorField[][] = []
    for (const field of fields) {
      if (field.control === 'section-toggle') continue
      const last = chunks[chunks.length - 1]
      if (last && isFormField(last[0]) && isFormField(field)) last.push(field)
      else chunks.push([field])
    }
    return chunks.map(chunk => isFormField(chunk[0])
      ? html`${renderForm(this.ctx, chunk, value, defaults, changes => this._update(path, changes))}`
      : this._renderControl(chunk[0], path, value, defaults))
  }

  private _default(field: EditorField): unknown {
    return typeof field.default === 'function' ? field.default(this.ctx) : field.default
  }

  private _renderControl(field: EditorField, path: string[], value: Data, defaults: Data): TemplateResult {
    if (field.control === 'percent') {
      const current = String(value[field.name] ?? defaults[field.name])
      // Absolute lengths (e.g. 4px) can't be shown on a percentage slider, so they keep the text field.
      if (!/^\d+(\.\d+)?%$/.test(current.trim())) return html`${renderForm(this.ctx, [{ ...field, control: undefined }], value, defaults, changes => this._update(path, changes))}`
      const label = this.t(`fields.${field.name}`)
      return html`
        <div class="percent">
          <div class="percent-label">${label}<span>${current}</span></div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            aria-label=${label}
            .value=${String(parseFloat(current))}
            @input=${(e: Event) => {
    const next = `${(e.target as HTMLInputElement).value}%`
    this._update(path, { [field.name]: next === defaults[field.name] ? undefined : next })
  }}
          />
        </div>
      `
    }
    if (field.control === 'rows') {
      return html`
        <clock-weather-card-rows-editor
          .hass=${this.hass}
          .config=${this._config}
          .rows=${(value.rows as RowConfig[] | undefined) ?? DEFAULT_ROWS}
          @rows-changed=${(e: CustomEvent<RowConfig[]>) => this._update(path, { rows: deepEqual(e.detail, DEFAULT_ROWS) ? undefined : e.detail })}
        ></clock-weather-card-rows-editor>
      `
    }
    if (field.control === 'color') {
      return html`
        <clock-weather-card-color-picker
          .hass=${this.hass}
          .label=${this.t(`fields.${field.name}`)}
          .value=${(value[field.name] ?? this._default(field)) as string | undefined}
          @color-changed=${(e: CustomEvent<string | null>) => this._update(path, { [field.name]: e.detail === this._default(field) ? undefined : e.detail })}
        ></clock-weather-card-color-picker>
      `
    }
    return html`
      <clock-weather-card-gradient-editor
        .hass=${this.hass}
        .gradient=${(value.gradient as Record<string, string> | undefined) ?? DEFAULT_GRADIENT}
        @gradient-changed=${(e: CustomEvent<Record<string, string>>) => this._update(path, { gradient: deepEqual(e.detail, DEFAULT_GRADIENT) ? undefined : e.detail })}
      ></clock-weather-card-gradient-editor>
    `
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .panel-header ha-icon {
      color: var(--secondary-text-color);
    }
    .sections {
      border: 1px solid var(--divider-color);
      border-radius: var(--ha-card-border-radius, 12px);
      overflow: hidden;
    }
    .section + .section {
      border-top: 1px solid var(--divider-color);
    }
    .section-head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 12px 12px 16px;
      cursor: pointer;
      outline: none;
      transition: background-color 120ms ease;
    }
    .section-head:hover, .section-head:focus-visible {
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.06);
    }
    .section.hidden .section-head {
      cursor: default;
    }
    .section-icon {
      display: grid;
      place-items: center;
      flex: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: var(--primary-color);
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.12);
      transition: color 120ms ease, background-color 120ms ease;
    }
    .section.hidden .section-icon {
      color: var(--disabled-text-color, #bdbdbd);
      background: var(--secondary-background-color);
    }
    .section-titles {
      flex: 1;
      min-width: 0;
    }
    .section-name {
      font-weight: 500;
    }
    .section.hidden .section-name {
      color: var(--secondary-text-color);
    }
    .section-summary {
      color: var(--secondary-text-color);
      font-size: 0.875em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chevron {
      color: var(--secondary-text-color);
      transition: transform 150ms ease;
    }
    .section.open .chevron {
      transform: rotate(180deg);
    }
    .section.hidden .chevron {
      visibility: hidden;
    }
    .section-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 4px 16px 16px;
    }
    .percent {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-bottom: 12px;
    }
    .percent-label {
      display: flex;
      justify-content: space-between;
    }
    .percent-label span {
      color: var(--secondary-text-color);
      font-variant-numeric: tabular-nums;
    }
    .percent input {
      width: 100%;
      margin: 0;
      accent-color: var(--primary-color);
    }
    .more ha-form, .group ha-form, .more clock-weather-card-gradient-editor, .more clock-weather-card-color-picker {
      display: block;
      padding-bottom: 12px;
    }
  `
}
