export function max (n: number[]): number {
  return Math.max(...n)
}

export function min (n: number[]): number {
  return Math.min(...n)
}

export function round (n: number, precision = 0): number {
  if (precision <= 0) {
    return Math.round(n)
  }
  return Math.ceil((n - precision / 2) / precision) * precision
}

export function roundUp (n: number, precision: number = 0): number {
  if (precision <= 0) {
    return Math.ceil(n)
  }
  return Math.ceil(n / precision) * precision
}

export function roundDown (n: number, precision = 0): number {
  if (precision <= 0) {
    return Math.floor(n)
  }
  return Math.floor(n / precision) * precision
}

export function roundIfNotNull (number: number | null): number | null {
  if (number === null) {
    return null
  }

  return Math.round(number)
}
// from https://stackoverflow.com/a/1053865
export function extractMostOccuring<T extends string | number | symbol> (elements: T[]): T {
  const modeMap = new Map<T, number>()
  let maxEl = elements[0]
  let maxCount = 1
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    if (modeMap.get(el) === undefined) {
      modeMap.set(el, 1)
    } else {
      const n = modeMap.get(el) ?? 0
      modeMap.set(el, n + 1)
      if ((modeMap.get(el) ?? 0) > maxCount) {
        maxEl = el
        maxCount = modeMap.get(el) ?? 0
      }
    }
  }
  return maxEl
}
