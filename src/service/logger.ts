/* eslint-disable no-console */
import { isDev } from '@/utils/development'

// eslint-disable-next-line no-restricted-imports
import { version as packageJsonVersion } from '../../package.json'

const DEDUP_WINDOW_MS = 3 * 60_000

class Logger {

  private logMessagePrefix!: string
  private logged = new Set<string>()
  private loggedSince = Date.now()

  constructor() {
    const version = isDev ? 'DEV' : packageJsonVersion
    this.logMessagePrefix = `clock-weather-card ${version}:`
  }

  public info = (msg: string, ...optionalParams: unknown[]): void => this.emit('info', console.log, msg, optionalParams)

  public warn = (msg: string, ...optionalParams: unknown[]): void => this.emit('warn', console.warn, msg, optionalParams)

  public error = (msg: string, ...optionalParams: unknown[]): void => this.emit('error', console.error, msg, optionalParams)

  public debug = (msg: string, ...optionalParams: unknown[]): void =>
    this.emit('debug', isDev ? console.log : console.debug, msg, optionalParams)

  private emit(level: string, sink: (...args: unknown[]) => void, msg: string, optionalParams: unknown[]): void {
    if (this.isFirst(level, msg, optionalParams)) sink(this.logMessagePrefix, msg, ...optionalParams)
  }

  // Render paths run on every hass update and clock tick, so repeats are suppressed until the window resets.
  private isFirst(level: string, msg: string, optionalParams: unknown[]): boolean {
    if (Date.now() - this.loggedSince >= DEDUP_WINDOW_MS) {
      this.logged.clear()
      this.loggedSince = Date.now()
    }
    const key = this.keyOf(level, msg, optionalParams)
    if (this.logged.has(key)) return false
    this.logged.add(key)
    return true
  }

  private keyOf(level: string, msg: string, optionalParams: unknown[]): string {
    try {
      return JSON.stringify([level, msg, ...optionalParams])
    } catch {
      return JSON.stringify([level, msg])
    }
  }
}

export default new Logger()
