export const isDev = import.meta.env.MODE === 'development'
export const generateCustomElementName = (): string => 'clock-weather-card' + (isDev ? '-dev' : '')
