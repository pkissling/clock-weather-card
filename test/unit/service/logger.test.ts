import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import logger from '@/service/logger'

describe('logger', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.advanceTimersByTime(3 * 60_000)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('suppresses repeats of the same message and params', () => {
    const warn = vi.spyOn(console, 'warn')
      .mockImplementation(() => {})

    logger.warn('repeated', 1)
    logger.warn('repeated', 1)
    logger.warn('repeated', 2)
    logger.warn('other')

    expect(warn.mock.calls.map(([, ...args]) => args))
      .toEqual([['repeated', 1], ['repeated', 2], ['other']])
  })

  it('dedups each level separately', () => {
    const warn = vi.spyOn(console, 'warn')
      .mockImplementation(() => {})
    const error = vi.spyOn(console, 'error')
      .mockImplementation(() => {})
    const debug = vi.spyOn(console, 'debug')
      .mockImplementation(() => {})
    const info = vi.spyOn(console, 'log')
      .mockImplementation(() => {})

    for (let i = 0; i < 2; i++) {
      logger.warn('same')
      logger.error('same')
      logger.debug('same')
      logger.info('same')
    }

    expect([warn, error, debug, info].map(spy => spy.mock.calls.length))
      .toEqual([1, 1, 1, 1])
  })

  it('logs a repeated message again once the 3 minute window has passed', () => {
    const warn = vi.spyOn(console, 'warn')
      .mockImplementation(() => {})

    logger.warn('windowed')
    vi.advanceTimersByTime(3 * 60_000 - 1)
    logger.warn('windowed')
    vi.advanceTimersByTime(1)
    logger.warn('windowed')

    expect(warn)
      .toHaveBeenCalledTimes(2)
  })
})
