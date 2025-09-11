/* eslint-disable no-console */
import { isDev } from '@/utils/development'

// eslint-disable-next-line no-restricted-imports
import { version as packageJsonVersion } from '../../package.json'

class Logger {

  private logMessagePrefix!: string

  constructor() {
    const version = isDev ? 'DEV' : packageJsonVersion
    this.logMessagePrefix = `clock-weather-card ${version}:`
  }

  public info = (msg: string, ...optionalParams: unknown[]): void => console.log(this.logMessagePrefix, msg, ...optionalParams)

  public warn = (msg: string, ...optionalParams: unknown[]): void => console.warn(this.logMessagePrefix, msg, ...optionalParams)

  public error = (msg: string, ...optionalParams: unknown[]): void => console.error(this.logMessagePrefix, msg, ...optionalParams)

  public debug = (msg: string, ...optionalParams: unknown[]): void => {
    if (isDev) {
      console.debug(this.logMessagePrefix, msg, ...optionalParams)
    }
  }
}

export default new Logger()
