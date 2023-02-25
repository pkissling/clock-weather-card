export function max(n: number[]): number {
  return Math.max(...n);
}

export function min(n: number[]): number {
  return Math.min(...n);
}

export function round(n: number, precision = 0): number {
  if (precision <= 0) {
    return Math.round(n);
  }
  return Math.ceil((n - precision / 2) / precision) * precision;
}

export function roundUp(n: number, precision = 0): number {
  if (!precision) {
    return Math.ceil(n);
  }
  return Math.ceil(n / precision) * precision;
}

export function roundDown(n: number, precision = 0): number {
  if (!precision) {
    return Math.floor(n);
  }
  return Math.floor(n / precision) * precision;
}

export function roundIfNotNull(number: number | null): number | null {
  if (number === null) {
    return null
  }

  return Math.round(number)
}
// from https://stackoverflow.com/a/1053865
export function extractMostOccuring<T extends string | number | symbol>(elements: T[]): T {
  const modeMap = {} as Record<T, number>; let maxEl = elements[0], maxCount = 1;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (modeMap[el] == null) {
      modeMap[el] = 1;
    } else {
      modeMap[el]++;
      if (modeMap[el] > maxCount) {
        maxEl = el;
        maxCount = modeMap[el];
      }
    }
    return maxEl;
  }
  return maxEl;
}