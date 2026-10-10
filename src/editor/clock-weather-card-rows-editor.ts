import type { HomeAssistant } from 'custom-card-helpers'
import { css, html, LitElement, nothing, type TemplateResult } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

import { controlStyles, iconButton, textButton } from '@/editor/controls'
import { ROW_FIELDS, SEGMENT_FIELDS, SEGMENT_ICONS } from '@/editor/fields'
import { attributeLabel, type Data, editorT, fireEvent, renderForm } from '@/editor/form'
import type { ClockWeatherCardConfig, RowConfig, SegmentConfig } from '@/types'
import { SEGMENT_TYPES } from '@/types'
import { DEFAULT_ROWS } from '@/utils/config'

type Focus = { row: number, item: number | 'settings' | 'adding' }

const NEW_SEGMENTS: { [T in SegmentConfig['type']]: SegmentConfig } = {
  time: { type: 'time' },
  date: { type: 'date' },
  weather: { type: 'weather' },
  entity: { type: 'entity', entity_id: '' },
  icon: { type: 'icon', icon: 'mdi:star-outline' },
  weather_icon: { type: 'weather_icon' },
  text: { type: 'text', text: '' },
  spacer: { type: 'spacer' },
}

const move = <T>(list: T[], from: number, to: number): T[] => {
  const next = [...list]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

@customElement('clock-weather-card-rows-editor')
export class ClockWeatherCardRowsEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant
  @property({ attribute: false }) public config!: ClockWeatherCardConfig
  @property({ attribute: false }) public rows: RowConfig[] = []
  @state() private _focus?: Focus

  private t(key: string): string {
    return editorT(this.hass, key)
  }

  private _emit(rows: RowConfig[], focus?: Focus): void {
    this._focus = focus
    fireEvent(this, 'rows-changed', rows)
  }

  private _updateRow(index: number, row: RowConfig, focus = this._focus): void {
    this._emit(this.rows.map((r, i) => i === index ? row : r), focus)
  }

  private _toggle(focus: Focus): void {
    const same = this._focus?.row === focus.row && this._focus.item === focus.item
    this._focus = same ? undefined : focus
  }

  protected render(): TemplateResult {
    return html`
      <div class="label">${this.t('fields.rows')}</div>
      ${this.rows.map((row, i) => this._renderRow(row, i))}
      <div class="footer">
        ${textButton('mdi:plus', this.t('actions.add_row'), () => this._emit([...this.rows, { segments: [] }], { row: this.rows.length, item: 'adding' }))}
        ${this.rows === DEFAULT_ROWS ? nothing : textButton('mdi:restore', this.t('actions.reset'), () => this._emit(DEFAULT_ROWS), true)}
      </div>
    `
  }

  private _renderRow(row: RowConfig, index: number): TemplateResult {
    const focus = this._focus?.row === index ? this._focus : undefined
    const last = this.rows.length - 1
    return html`
      <div class="row ${focus ? 'focused' : ''}" data-row=${index}>
        <div class="row-head">
          <span class="row-title">${this.t('row')} ${index + 1}</span>
          ${iconButton('mdi:tune-variant', this.t('actions.row_settings'), () => this._toggle({ row: index, item: 'settings' }), false, focus?.item === 'settings')}
          ${iconButton('mdi:arrow-up', this.t('actions.move_up'), () => this._emit(move(this.rows, index, index - 1)), index === 0)}
          ${iconButton('mdi:arrow-down', this.t('actions.move_down'), () => this._emit(move(this.rows, index, index + 1)), index === last)}
          ${iconButton('mdi:delete-outline', this.t('actions.delete'), () => this._emit(this.rows.filter((_, i) => i !== index)))}
        </div>
        <div class="chips" style="justify-content: ${row.alignment ?? 'left'}; font-size: ${row.font_size ? 'clamp(0.875rem, ' + row.font_size + ', 1.25rem)' : 'inherit'}">
          ${row.segments.length ? nothing : html`<span class="empty">${this.t('empty_row')}</span>`}
          ${row.segments.map((segment, s) => this._renderChip(segment, index, s, focus?.item === s))}
          <button
            class="chip add ${focus?.item === 'adding' ? 'selected' : ''}"
            aria-label=${this.t('actions.add_segment')}
            title=${this.t('actions.add_segment')}
            @click=${() => this._toggle({ row: index, item: 'adding' })}
          ><ha-icon icon="mdi:plus"></ha-icon></button>
        </div>
        ${focus?.item === 'adding' ? this._renderTray(row, index) : nothing}
        ${focus?.item === 'settings' ? html`
          <div class="panel">
            ${renderForm({ hass: this.hass, config: this.config }, ROW_FIELDS, row as unknown as Data, {}, changes => this._updateRow(index, { ...row, ...changes } as RowConfig))}
          </div>
        ` : nothing}
        ${typeof focus?.item === 'number' && row.segments[focus.item] ? this._renderSegmentPanel(row, index, focus.item) : nothing}
      </div>
    `
  }

  private _renderChip(segment: SegmentConfig, row: number, index: number, selected: boolean): TemplateResult {
    const icon = segment.type === 'icon' ? segment.icon : SEGMENT_ICONS[segment.type]
    const label = this._chipLabel(segment)
    return html`
      <button
        class="chip ${segment.type} ${selected ? 'selected' : ''}"
        data-segment=${segment.type}
        title=${this.t(`segments.${segment.type}`)}
        @click=${() => this._toggle({ row, item: index })}
      >
        <ha-icon icon=${icon}></ha-icon>${label ? html`<span>${label}</span>` : nothing}
      </button>
    `
  }

  private _chipLabel(segment: SegmentConfig): string {
    switch (segment.type) {
    case 'time': return segment.time_pattern ?? this.t('segments.time')
    case 'date': return segment.date_pattern ?? this.t('segments.date')
    case 'weather': return segment.attribute ? attributeLabel(this.hass, segment.attribute) : this.t('segments.weather')
    case 'entity': {
      const name = this.hass.states[segment.entity_id]?.attributes.friendly_name ?? segment.entity_id
      return [name || this.t('segments.entity'), segment.attribute].filter(Boolean)
        .join(' · ')
    }
    case 'text': return segment.text ? `“${segment.text}”` : this.t('segments.text')
    default: return ''
    }
  }

  private _renderTray(row: RowConfig, index: number): TemplateResult {
    return html`
      <div class="tray">
        ${SEGMENT_TYPES.map(type => html`
          <button class="tile" data-add=${type} @click=${() => this._updateRow(index, { ...row, segments: [...row.segments, NEW_SEGMENTS[type]] }, { row: index, item: row.segments.length })}>
            <ha-icon icon=${SEGMENT_ICONS[type]}></ha-icon>
            <span class="tile-name">${this.t(`segments.${type}`)}</span>
            <span class="tile-hint">${this.t(`segment_hints.${type}`)}</span>
          </button>
        `)}
      </div>
    `
  }

  private _renderSegmentPanel(row: RowConfig, rowIndex: number, index: number): TemplateResult {
    const segment = row.segments[index]
    const setSegments = (segments: SegmentConfig[], focus?: Focus): void => this._updateRow(rowIndex, { ...row, segments }, focus)
    const last = row.segments.length - 1
    return html`
      <div class="panel">
        <div class="panel-head">
          <ha-icon icon=${SEGMENT_ICONS[segment.type]}></ha-icon>
          <div class="panel-titles">
            <div class="panel-name">${this.t(`segments.${segment.type}`)}</div>
            <div class="panel-hint">${this.t(`segment_hints.${segment.type}`)}</div>
          </div>
          ${iconButton('mdi:arrow-left', this.t('actions.move_left'), () => setSegments(move(row.segments, index, index - 1), { row: rowIndex, item: index - 1 }), index === 0)}
          ${iconButton('mdi:arrow-right', this.t('actions.move_right'), () => setSegments(move(row.segments, index, index + 1), { row: rowIndex, item: index + 1 }), index === last)}
          ${iconButton('mdi:delete-outline', this.t('actions.delete'), () => setSegments(row.segments.filter((_, i) => i !== index), undefined))}
        </div>
        ${renderForm(
    { hass: this.hass, config: this.config },
    SEGMENT_FIELDS[segment.type],
          segment as unknown as Data,
          {},
          changes => setSegments(row.segments.map((s, i) => i === index ? { ...s, ...changes } as SegmentConfig : s)),
  )}
      </div>
    `
  }

  static styles = [controlStyles, css`
    .row {
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      padding: 4px 8px 8px;
      transition: border-color 120ms ease;
    }
    .row.focused {
      border-color: var(--primary-color);
    }
    .row-head {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .row-title {
      flex: 1;
      color: var(--secondary-text-color);
      font-size: 0.75em;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding-left: 4px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      min-height: 36px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 100%;
      height: 32px;
      padding: 0 12px;
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      background: var(--card-background-color, var(--primary-background-color));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: background-color 120ms ease, border-color 120ms ease, transform 80ms ease;
      --mdc-icon-size: 18px;
    }
    .chip span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chip:hover {
      border-color: var(--primary-color);
    }
    .chip:active {
      transform: scale(0.96);
    }
    .chip.selected {
      background: var(--cwc-tint);
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    .chip.icon, .chip.weather_icon {
      padding: 0 7px;
    }
    .chip.spacer {
      flex: 1;
      justify-content: center;
      min-width: 48px;
      border-style: dashed;
      color: var(--secondary-text-color);
    }
    .chip.add {
      padding: 0 7px;
      border-style: dashed;
      color: var(--primary-color);
    }
    .empty {
      color: var(--secondary-text-color);
      font-style: italic;
      font-size: 0.875em;
    }
    .tray {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 6px;
      margin-top: 8px;
      animation: appear 150ms ease;
    }
    .tile {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: 8px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: none;
      text-align: start;
      transition: background-color 120ms ease, border-color 120ms ease;
    }
    .tile:hover {
      background: var(--cwc-tint);
      border-color: var(--primary-color);
    }
    .tile ha-icon {
      color: var(--primary-color);
      --mdc-icon-size: 20px;
      margin-bottom: 2px;
    }
    .tile-name {
      font-weight: 500;
      font-size: 0.875em;
    }
    .tile-hint {
      color: var(--secondary-text-color);
      font-size: 0.75em;
      line-height: 1.3;
    }
    .panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
      padding: 12px 4px 4px;
      border-top: 1px solid var(--divider-color);
      animation: appear 150ms ease;
    }
    .panel-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .panel-head > ha-icon {
      color: var(--primary-color);
    }
    .panel-titles {
      flex: 1;
      min-width: 0;
    }
    .panel-name {
      font-weight: 500;
    }
    .panel-hint {
      color: var(--secondary-text-color);
      font-size: 0.8125em;
    }
    @keyframes appear {
      from { opacity: 0; transform: translateY(-4px); }
    }
    @media (prefers-reduced-motion: reduce) {
      .tray, .panel { animation: none; }
    }
  `]
}
