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
