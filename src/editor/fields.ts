import { DateTime } from 'luxon'

import { editorT, type FormContext, localeOptions, NO_UNIT, TIME_ZONES, weatherIconUrl } from '@/editor/form'
import hassService from '@/service/hass-service'
import type { SegmentConfig } from '@/types'
import { ROW_ALIGNMENTS, SECTION_FORECAST_TYPES, TEMPERATURE_UNIT_SYMBOLS, WEATHER_ICON_TYPES } from '@/types'
import { defaultAttributeColor, DEFAULTS } from '@/utils/config'
import { DEFAULT_TIME_PATTERN } from '@/utils/luxon'

export type SectionKey = 'header' | 'forecast_strip' | 'forecast_list'
export type CardGroup = 'essentials' | 'appearance' | 'interaction' | 'region'
type Data = Record<string, unknown>

export interface EditorField {
  name: string
  // Rendered by ha-form; a function builds context-dependent selectors.
  selector?: object | ((ctx: FormContext, value: unknown) => object)
  // Rendered by a dedicated control instead of ha-form.
  control?: 'section-toggle' | 'rows' | 'segments' | 'gradient' | 'color' | 'percent'
  // An empty string is a meaningful value, offered as an explicit choice.
  allowEmpty?: boolean
  // Shown preselected while unset; picking it removes the option again. A function resolves defaults that depend on Home Assistant.
  default?: unknown | ((ctx: FormContext) => unknown)
  required?: boolean
  advanced?: boolean
  group?: CardGroup
  context?: Record<string, string>
  visible?: (data: Data) => boolean
}

export const FORECAST_ATTRIBUTES = ['precipitation_probability', 'precipitation', 'humidity', 'wind_speed', 'wind_gust_speed', 'uv_index', 'cloud_coverage', 'apparent_temperature', 'dew_point', 'pressure']

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

const inheritedIconType = { selector: iconTypeSelector, default: ({ config }: FormContext) => config.weather_icon_type ?? DEFAULTS.weather_icon_type }

const TIME_PATTERNS = ['t', 'tt', 'T', 'TT', 'HH:mm', 'HH:mm:ss', 'H:mm', 'h:mm a', 'h:mm:ss a']
const FORECAST_TIME_PATTERNS = ['t', 'T', 'HH:mm', 'H:mm', 'h:mm a', 'H', 'h a']
const DATE_PATTERNS = ['DDD', 'DDDD', 'DD', 'D', 'cccc, d LLLL', 'ccc, d LLL', 'd LLLL yyyy', 'LLLL d, yyyy', 'dd.MM.yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'cccc', 'LLLL yyyy']

// Lists each pattern with a preview of now in the card's locale and time zone; patterns rendering identically are listed once.
const patternSelector = (patterns: string[]) => ({ hass, config }: FormContext): object => {
  const now = DateTime.now()
    .setLocale(config.locale || hassService.getLocale(hass))
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
  { name: 'tap_action', selector: { ui_action: {} }, group: 'interaction' },
  { name: 'locale', selector: ({ hass }: FormContext) => ({ select: { custom_value: true, options: localeOptions(hass) } }), default: ({ hass }: FormContext) => hassService.getLocale(hass), group: 'region' },
  { name: 'time_zone', selector: { select: { custom_value: true, options: TIME_ZONES } }, default: ({ hass }: FormContext) => hassService.getTimeZone(hass), group: 'region' },
  { name: 'sun_entity', selector: { entity: { domain: 'sun' } }, group: 'region' },
]

const sectionCommon = (forecastType: SectionKey): EditorField[] => [
  { name: 'hide', control: 'section-toggle' },
  { name: 'forecast_type', selector: { select: { mode: 'box', options: SECTION_FORECAST_TYPES } } },
  { name: 'count', selector: { number: { min: 1, mode: 'box', step: 1 } } },
  { name: 'attribute', selector: attributeSelector(forecastType === 'forecast_list' ? ['temperature'] : []) },
  { name: 'time_pattern', selector: patternSelector(FORECAST_TIME_PATTERNS), default: DEFAULT_TIME_PATTERN, advanced: true, visible: d => d.forecast_type === 'hourly' },
]

const sectionLook: EditorField[] = [
  { name: 'weather_entity', selector: { entity: { domain: 'weather' } }, default: ({ config }: FormContext) => config.entity, advanced: true },
  { name: 'round_temperatures', selector: bool, advanced: true },
  { name: 'animated_icons', selector: bool, advanced: true },
  { name: 'weather_icon_type', ...inheritedIconType, advanced: true },
]

export const SECTION_FIELDS: Record<SectionKey, EditorField[]> = {
  header: [
    { name: 'hide', control: 'section-toggle' },
    { name: 'rows', control: 'rows' },
    { name: 'animated_icons', selector: bool },
    { name: 'weather_icon_size', selector: text, advanced: true },
    { name: 'weather_icon_type', ...inheritedIconType, advanced: true },
  ],
  forecast_strip: [
    ...sectionCommon('forecast_strip'),
    { name: 'attribute_icon', selector: { icon: {} }, default: ({ config }: FormContext) => config.sections?.forecast_strip?.attribute ? undefined : 'mdi:water', advanced: true },
    { name: 'attribute_unit', selector: unitSelector, allowEmpty: true, advanced: true },
    {
      name: 'attribute_color',
      control: 'color',
      default: ({ config }: FormContext) => defaultAttributeColor(config.sections?.forecast_strip, config.sections?.forecast_strip?.weather_icon_type ?? config.weather_icon_type ?? DEFAULTS.weather_icon_type) ?? undefined,
      advanced: true,
    },
    { name: 'hide_sunrise_sunset', selector: bool, advanced: true, visible: d => d.forecast_type === 'hourly' },
    ...sectionLook,
  ],
  forecast_list: [
    ...sectionCommon('forecast_list'),
    { name: 'attribute_unit', selector: unitSelector, allowEmpty: true, advanced: true },
    { name: 'gradient', control: 'gradient', advanced: true },
    { name: 'row_height', selector: text, advanced: true },
    { name: 'bar_thickness', control: 'percent', selector: text, advanced: true },
    { name: 'hide_current_temp_indicator', selector: bool, advanced: true, visible: d => d.attribute === 'temperature' },
    ...sectionLook,
  ],
}

export const ROW_FIELDS: EditorField[] = [
  { name: 'segments', control: 'segments' },
  { name: 'alignment', selector: { select: { mode: 'box', options: ROW_ALIGNMENTS } }, default: () => document.dir === 'rtl' ? 'right' : 'left' },
  { name: 'font_size', selector: text },
]

const unitFields = (attributeSelector: EditorField, hasAttribute: (d: Data) => boolean): EditorField[] => [
  { ...attributeSelector, name: 'attribute' },
  { name: 'show_unit', selector: bool, default: true, visible: hasAttribute },
  { name: 'unit', selector: text, visible: d => hasAttribute(d) && d.show_unit !== false },
  { ...attributeSelector, name: 'unit_attribute', visible: d => hasAttribute(d) && d.show_unit !== false },
]

export const SEGMENT_FIELDS: { [T in SegmentConfig['type']]: EditorField[] } = {
  time: [{ name: 'time_pattern', selector: patternSelector(TIME_PATTERNS), default: DEFAULT_TIME_PATTERN }],
  date: [{ name: 'date_pattern', selector: patternSelector(DATE_PATTERNS), default: 'DDD' }],
  weather: unitFields({ name: 'attribute', selector: ({ config }: FormContext) => ({ attribute: { entity_id: config.entity } }) }, d => !!d.attribute),
  entity: [
    { name: 'entity_id', selector: { entity: {} }, required: true },
    ...unitFields({ name: 'attribute', selector: { attribute: {} }, context: { filter_entity: 'entity_id' } }, () => true),
  ],
  icon: [{ name: 'icon', selector: { icon: {} }, required: true }],
  weather_icon: [{ name: 'entity_id', selector: { entity: { domain: 'weather' } } }],
  text: [{ name: 'text', selector: text, required: true }],
  spacer: [],
}

export const SEGMENT_ICONS: { [T in SegmentConfig['type']]: string } = {
  time: 'mdi:clock-outline',
  date: 'mdi:calendar',
  weather: 'mdi:weather-partly-cloudy',
  entity: 'mdi:shape-outline',
  icon: 'mdi:emoticon-outline',
  weather_icon: 'mdi:weather-sunny',
  text: 'mdi:format-text',
  spacer: 'mdi:arrow-expand-horizontal',
}

// Every config path the editor can set, used to verify it covers the whole config surface.
export const editorPaths = (): string[] => [
  ...CARD_FIELDS.map(f => f.name),
  ...Object.entries(SECTION_FIELDS)
    .flatMap(([section, fields]) => fields.map(f => `sections.${section}.${f.name}`)),
]
