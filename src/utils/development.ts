export const isDev = import.meta.env.MODE === 'development'
export const customElementName = 'clock-weather-card' + (isDev ? '-dev' : '')
