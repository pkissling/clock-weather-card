import { DateTime } from 'luxon'

import { editorT, type FormContext, localeOptions, NO_UNIT, TIME_ZONES, weatherIconUrl } from '@/editor/form'
import hassService from '@/service/hass-service'
import type { SegmentConfig } from '@/types'
import { ROW_ALIGNMENTS, SECTION_FORECAST_TYPES, TEMPERATURE_UNIT_SYMBOLS, WEATHER_ICON_TYPES } from '@/types'
import { DEFAULT_TAP_ACTION, defaultAttributeColor, DEFAULTS } from '@/utils/config'
import { DEFAULT_DATE_PATTERN, DEFAULT_TIME_PATTERN } from '@/utils/luxon'

export type SectionKey = 'header' | 'forecast_strip' | 'forecast_list'
export type CardGroup = 'essentials' | 'appearance' | 'interaction' | 'region'
type Data = Record<string, unknown>

export interface EditorField {
  name: string
  // Rendered by ha-form; a function builds context-dependent selectors.
  selector?: object | ((ctx: FormContext) => object)
  // Rendered by a dedicated control instead of ha-form.
  control?: 'section-toggle' | 'rows' | 'segments' | 'gradient' | 'color' | 'slider'
  // Range of a slider control; it writes `${value}${unit}` and falls back to a text field for other values.
  slider?: { min: number, max: number, step: number, unit: string }
  // An empty string is a meaningful value, offered as an explicit choice.
  allowEmpty?: boolean
  // Adds an option that sets another (boolean) option instead, e.g. "No unit" setting show_unit: false.
  none?: { name: string, value: boolean, label: string }
  // Shown preselected while unset; picking it removes the option again. A function resolves defaults that depend on Home Assistant.
  default?: unknown | ((ctx: FormContext) => unknown)
  required?: boolean
  advanced?: boolean
  // Overrides a card-wide option; listed last under a heading of its own.
  override?: boolean
  group?: CardGroup
  context?: Record<string, string>
  visible?: (data: Data) => boolean
}

const FORECAST_ATTRIBUTES = ['precipitation_probability', 'precipitation', 'humidity', 'wind_speed', 'wind_gust_speed', 'uv_index', 'cloud_coverage', 'apparent_temperature', 'dew_point', 'pressure']

const text = { text: {} }
const bool = { boolean: {} }
const attributeSelector = (extra: string[] = []): object => ({ select: { options: [...extra, ...FORECAST_ATTRIBUTES], custom_value: true, sort: false } })

const iconTypeSelector = ({ hass }: FormContext): object => ({
  select: {
    mode: 'box',
    box_max_columns: 4,
    options: WEATHER_ICON_TYPES.map(value => ({ value, label: editorT(hass, `options.${value}`), image: weatherIconUrl(value) })),
  },
})

const inheritedIconType = { selector: iconTypeSelector, default: ({ config }: FormContext) => config.weather_icon_type ?? DEFAULTS.weather_icon_type, advanced: true, override: true }
const inheritedRounding = { selector: bool, default: ({ config }: FormContext) => config.round_temperatures ?? DEFAULTS.round_temperatures, advanced: true, override: true }
const overrides: EditorField[] = [
  { name: 'weather_icon_type', ...inheritedIconType },
  { name: 'round_temperatures', ...inheritedRounding },
]

const slider = (min: number, max: number, step: number, unit: string): Pick<EditorField, 'control' | 'slider'> => ({ control: 'slider', slider: { min, max, step, unit } })
const forecastFontSize: EditorField = { name: 'font_size', ...slider(0.5, 3, 0.25, 'rem'), default: '1rem' }

const TIME_PATTERNS = ['t', 'tt', 'T', 'TT', 'HH:mm', 'HH:mm:ss', 'H:mm', 'h:mm a', 'h:mm:ss a']
const FORECAST_TIME_PATTERNS = ['t', 'T', 'HH:mm', 'H:mm', 'h:mm a', 'H', 'h a']
const DATE_PATTERNS = ['DDD', 'DDDD', 'DD', 'D', 'cccc, d LLLL', 'ccc, d LLL', 'd LLLL yyyy', 'LLLL d, yyyy', 'dd.MM.yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'cccc', 'LLLL yyyy']

// Lists each pattern with a preview of now in the card's locale and time zone; patterns rendering identically are listed once.
const patternSelector = (patterns: string[]) => ({ hass, config }: FormContext): object => {
  const now = DateTime.now()
    .setLocale(hassService.withHourCycle(hass, config.locale || hassService.getLocale(hass)))
    .setZone(config.time_zone || hassService.getTimeZone(hass))
  const byPreview = new Map<string, string>()
  for (const pattern of patterns) if (!byPreview.has(now.toFormat(pattern))) byPreview.set(now.toFormat(pattern), pattern)
  const options = [...byPreview].map(([preview, value]) => ({ value, label: `${preview}  ·  ${value}` }))
  return { select: { custom_value: true, sort: false, options } }
}

const temperatureUnitOf = ({ hass }: FormContext): string | undefined =>
  Object.entries(TEMPERATURE_UNIT_SYMBOLS)
    .find(([, symbol]) => symbol === hassService.getTemperatureUnit(hass))?.[0]

const unitSelector = ({ hass }: FormContext): object => ({ select: { custom_value: true, options: [{ value: NO_UNIT, label: editorT(hass, 'no_unit') }] } })

export const CARD_FIELDS: EditorField[] = [
  { name: 'entity', selector: { entity: { domain: 'weather' } }, required: true, group: 'essentials' },
  { name: 'title', selector: text, group: 'essentials' },
  { name: 'weather_icon_type', selector: iconTypeSelector, group: 'appearance' },
  { name: 'temperature_unit', selector: { select: { mode: 'box', options: Object.keys(TEMPERATURE_UNIT_SYMBOLS) } }, default: temperatureUnitOf, group: 'appearance' },
  { name: 'round_temperatures', selector: bool, group: 'appearance' },
  { name: 'tap_action', selector: { ui_action: { default_action: DEFAULT_TAP_ACTION.action } }, group: 'interaction' },
  { name: 'locale', selector: ({ hass }: FormContext) => ({ select: { custom_value: true, options: localeOptions(hass) } }), default: ({ hass }: FormContext) => hassService.getLocale(hass), group: 'region' },
  { name: 'time_zone', selector: { select: { custom_value: true, options: TIME_ZONES } }, default: ({ hass }: FormContext) => hassService.getTimeZone(hass), group: 'region' },
  { name: 'sun_entity', selector: { entity: { domain: 'sun' } }, group: 'region' },
]

export const SENSOR_FIELDS: EditorField[] = [
  { name: 'temperature', selector: { entity: { domain: 'sensor', device_class: 'temperature' } } },
]

const forecastBasics: EditorField[] = [
  { name: 'hide', control: 'section-toggle' },
  { name: 'forecast_type', selector: { select: { mode: 'box', options: SECTION_FORECAST_TYPES } } },
  { name: 'count', selector: { number: { min: 1, mode: 'box', step: 1 } } },
]

const forecastSource: EditorField[] = [
  { name: 'time_pattern', selector: patternSelector(FORECAST_TIME_PATTERNS), default: DEFAULT_TIME_PATTERN, advanced: true, visible: d => d.forecast_type === 'hourly' },
  { name: 'weather_entity', selector: { entity: { domain: 'weather' } }, default: ({ config }: FormContext) => config.entity, advanced: true },
]

export const SECTION_FIELDS: Record<SectionKey, EditorField[]> = {
  header: [
    { name: 'hide', control: 'section-toggle' },
    { name: 'rows', control: 'rows' },
    { name: 'weather_icon_size', ...slider(4, 20, 0.5, 'rem') },
    { name: 'animated_icons', selector: bool },
    ...overrides,
  ],
  forecast_strip: [
    ...forecastBasics,
    { name: 'attribute', selector: attributeSelector(), none: { name: 'hide_attribute', value: true, label: 'hidden' } },
    forecastFontSize,
    { name: 'animated_icons', selector: bool },
    { name: 'hide_sunrise_sunset', selector: bool, visible: d => d.forecast_type === 'hourly' },
    { name: 'attribute_icon', selector: { icon: {} }, default: ({ config }: FormContext) => config.sections?.forecast_strip?.attribute ? undefined : 'mdi:water', advanced: true, visible: d => d.hide_attribute !== true },
    {
      name: 'attribute_color',
      control: 'color',
      default: ({ config }: FormContext) => defaultAttributeColor(config.sections?.forecast_strip, config.sections?.forecast_strip?.weather_icon_type ?? config.weather_icon_type ?? DEFAULTS.weather_icon_type) ?? undefined,
      advanced: true,
      visible: d => d.hide_attribute !== true,
    },
    { name: 'attribute_unit', selector: unitSelector, allowEmpty: true, advanced: true, visible: d => d.hide_attribute !== true },
    ...forecastSource,
    ...overrides,
  ],
  forecast_list: [
    ...forecastBasics,
    { name: 'attribute', selector: attributeSelector(['temperature']) },
    forecastFontSize,
    { name: 'row_height', ...slider(16, 80, 2, 'px') },
    { name: 'bar_thickness', ...slider(5, 100, 5, '%') },
    { name: 'animated_icons', selector: bool },
    { name: 'gradient', control: 'gradient', advanced: true },
    { name: 'attribute_unit', selector: unitSelector, allowEmpty: true, advanced: true },
    { name: 'hide_current_temp_indicator', selector: bool, advanced: true, visible: d => d.attribute === 'temperature' },
    ...forecastSource,
    ...overrides,
  ],
}

export const ROW_FIELDS: EditorField[] = [
  { name: 'segments', control: 'segments' },
  { name: 'alignment', selector: { select: { mode: 'box', options: ROW_ALIGNMENTS } }, default: () => document.dir === 'rtl' ? 'right' : 'left' },
  { name: 'font_size', ...slider(0.5, 8, 0.25, 'rem') },
]

// Empty means the automatic unit; "No unit" sets show_unit: false.
const unitFields = (attributeSelector: EditorField, hasAttribute: (d: Data) => boolean): EditorField[] => [
  { ...attributeSelector, name: 'attribute' },
  { name: 'unit', selector: { select: { custom_value: true, options: [] } }, none: { name: 'show_unit', value: false, label: 'no_unit' }, visible: hasAttribute },
  { ...attributeSelector, name: 'unit_attribute', visible: d => hasAttribute(d) && d.show_unit !== false && !d.unit },
]

const entityValueFields: EditorField[] = [
  { name: 'entity_id', selector: { entity: {} }, required: true },
  ...unitFields({ name: 'attribute', selector: { attribute: {} }, context: { filter_entity: 'entity_id' } }, () => true),
]

export const SEGMENT_FIELDS: { [T in SegmentConfig['type']]: EditorField[] } = {
  time: [{ name: 'time_pattern', selector: patternSelector(TIME_PATTERNS), default: DEFAULT_TIME_PATTERN }],
  date: [{ name: 'date_pattern', selector: patternSelector(DATE_PATTERNS), default: DEFAULT_DATE_PATTERN }],
  weather: unitFields({ name: 'attribute', selector: ({ config }: FormContext) => ({ attribute: { entity_id: config.entity } }) }, d => !!d.attribute),
  entity: entityValueFields,
  badge: [
    ...entityValueFields,
    { name: 'background_color', control: 'gradient' },
    { name: 'text_color', control: 'color' },
  ],
  icon: [
    // The rows editor's icon_source choice switches between the two by setting or removing entity_id.
    { name: 'icon', selector: { icon: {} }, required: true, visible: d => d.entity_id === undefined },
    { name: 'entity_id', selector: { entity: {} }, required: true, visible: d => d.entity_id !== undefined },
  ],
  weather_icon: [{ name: 'entity_id', selector: { entity: { domain: 'weather' } } }],
  text: [{ name: 'text', selector: text, required: true }],
  template: [{ name: 'template', selector: { template: {} }, required: true }],
  spacer: [],
}

export const SEGMENT_ICONS: { [T in SegmentConfig['type']]: string } = {
  time: 'mdi:clock-outline',
  date: 'mdi:calendar',
  weather: 'mdi:weather-partly-cloudy',
  entity: 'mdi:shape-outline',
  badge: 'mdi:label-outline',
  icon: 'mdi:emoticon-outline',
  weather_icon: 'mdi:weather-sunny',
  text: 'mdi:format-text',
  template: 'mdi:code-braces',
  spacer: 'mdi:arrow-expand-horizontal',
}

// The options a field sets, including the one its "none" choice sets.
export const fieldNames = (fields: EditorField[]): string[] => fields.flatMap(f => f.none ? [f.name, f.none.name] : [f.name])

// Every config path the editor can set, used to verify it covers the whole config surface.
export const editorPaths = (): string[] => [
  ...fieldNames(CARD_FIELDS),
  ...fieldNames(SENSOR_FIELDS)
    .map(name => `additional_sensors.${name}`),
  ...Object.entries(SECTION_FIELDS)
    .flatMap(([section, fields]) => fieldNames(fields)
      .map(name => `sections.${section}.${name}`)),
]
