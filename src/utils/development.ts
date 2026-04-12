export const isDev = import.meta.env.MODE === 'development'

export const customElementName = (name: string): string => name + (isDev ? '-dev' : '')
