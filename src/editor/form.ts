import type { HomeAssistant } from 'custom-card-helpers'
import { html, nothing, type TemplateResult } from 'lit'

import type { EditorField } from '@/editor/fields'
import hassService from '@/service/hass-service'
import iconsService from '@/service/icons-service'
import translationsService from '@/service/translations-service'
import type { ClockWeatherCardConfig, WeatherIconType } from '@/types'

export type Data = Record<string, unknown>

export interface FormContext {
  hass: HomeAssistant
  config: ClockWeatherCardConfig
}

// ha-form can't represent "unset" or an empty string as a choice, so these stand in for them.
translationsService.register('editor', import.meta.glob('../locales/editor/*.json', { eager: true, import: 'default' }))

export const NO_UNIT = '__no_unit__'

export const editorT = (hass: HomeAssistant, key: string): string => translationsService.t(hassService.getLocale(hass), `editor.${key}`)

const hasKey = (key: string): boolean => translationsService.has(`editor.${key}`)

export const attributeLabel = (hass: HomeAssistant, attribute: string): string =>
  hasKey(`attributes.${attribute}`) ? editorT(hass, `attributes.${attribute}`) : attribute

export const weatherIconUrl = (type: WeatherIconType): string | undefined => iconsService.getWeatherIcon(type, false, 'partlycloudy', false)

const localeOptionsCache = new Map<string, { value: string, label: string }[]>()

export const localeOptions = (hass: HomeAssistant): { value: string, label: string }[] => {
  const language = hassService.getLocale(hass)
  const cached = localeOptionsCache.get(language)
  if (cached) return cached
  const names = new Intl.DisplayNames([language], { type: 'language' })
  const options = translationsService.languages
    .map(file => Intl.getCanonicalLocales(file)[0])
    .map(value => ({ value, label: `${names.of(value) ?? value} (${value})` }))
    .sort((a, b) => a.label.localeCompare(b.label))
  localeOptionsCache.set(language, options)
  return options
}

export const TIME_ZONES = (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone')

const optionLabel = (hass: HomeAssistant, value: string): string =>
  hasKey(`options.${value}`) ? editorT(hass, `options.${value}`) : attributeLabel(hass, value)

function selectorFor(field: EditorField, ctx: FormContext, current: unknown): object {
  const selector = typeof field.selector === 'function' ? field.selector(ctx, current) : field.selector ?? {}
  const select = (selector as { select?: { options: readonly (string | object)[] } }).select
  if (!select) return selector
  const options = select.options.map(o => typeof o === 'string' ? { value: o, label: optionLabel(ctx.hass, o) } : o)
  // A custom value typed by the user must still show up as the selected option.
  if (typeof current === 'string' && current !== '' && !options.some(o => (o as { value: string }).value === current)) options.push({ value: current, label: current })
  return { select: { ...select, options } }
}

const toFormValue = (field: EditorField, value: unknown): unknown => {
  if (field.allowEmpty && value === '') return NO_UNIT
  return value
}

const fromFormValue = (field: EditorField, value: unknown, defaultValue: unknown): unknown => {
  if (value === NO_UNIT) return ''
  if (value === defaultValue) return undefined
  if (value === '' || value === undefined) return field.required ? '' : undefined
  return value
}

export const isFormField = (field: EditorField): boolean => !field.control

// Renders the plain fields via ha-form and reports the changed keys, with undefined meaning "remove".
export function renderForm(ctx: FormContext, fields: EditorField[], value: Data, defaults: Data, onChange: (changes: Data) => void): TemplateResult | typeof nothing {
  const defaultOf = (f: EditorField): unknown => (typeof f.default === 'function' ? f.default(ctx) : f.default) ?? defaults[f.name]
  const data: Data = Object.fromEntries(fields.map(f => [f.name, toFormValue(f, value[f.name] ?? defaultOf(f))]))
  // Conditions may depend on options rendered in another chunk (e.g. forecast_type for advanced options).
  const visibilityData = { ...defaults, ...value, ...data }
  const visible = fields.filter(f => isFormField(f) && (!f.visible || f.visible(visibilityData)))
  if (!visible.length) return nothing
  const schema = visible.map(f => ({
    name: f.name,
    required: f.required,
    context: f.context,
    selector: selectorFor(f, ctx, data[f.name]),
  }))
  return html`
    <ha-form
      .hass=${ctx.hass}
      .data=${data}
      .schema=${schema}
      .computeLabel=${(s: { name: string }) => editorT(ctx.hass, `fields.${s.name}`)}
      .computeHelper=${(s: { name: string }) => hasKey(`helpers.${s.name}`) ? editorT(ctx.hass, `helpers.${s.name}`) : undefined}
      @value-changed=${(e: CustomEvent<{ value: Data }>) => {
    e.stopPropagation()
    const next = e.detail.value
    const changes = Object.fromEntries(visible
      .filter(f => next[f.name] !== data[f.name])
      .map(f => [f.name, fromFormValue(f, next[f.name], defaultOf(f))]))
    if (Object.keys(changes).length) onChange(changes)
  }}
    ></ha-form>
  `
}

// Merges changes into the object at path, dropping undefined/null keys (CustomEvent turns an undefined detail into null) and any object left empty.
export function setIn(obj: Data, path: string[], changes: Data): Data {
  const [head, ...rest] = path
  const target = head === undefined ? { ...obj, ...changes } : { ...obj, [head]: setIn((obj[head] as Data | undefined) ?? {}, rest, changes) }
  for (const [k, v] of Object.entries(target)) {
    const emptyObject = typeof v === 'object' && v !== null && !Array.isArray(v) && !Object.keys(v).length
    if (v === undefined || v === null || (k === head && emptyObject)) delete target[k]
  }
  return target
}

export const fireEvent = (el: HTMLElement, type: string, detail: unknown): void => {
  el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }))
}
