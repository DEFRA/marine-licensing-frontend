// @vitest-environment jsdom
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { logger } from './logger.js'

describe('logger', () => {
  let consoleErrorSpy

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('should call console.error with message only', () => {
    const message = 'Test error message'

    logger.error(message)

    expect(consoleErrorSpy).toHaveBeenCalledWith(message)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
  })

  test('should call console.error with message and context', () => {
    const message = 'Test error with context'
    const context = { foo: 'bar', count: 42 }

    logger.error(message, context)

    expect(consoleErrorSpy).toHaveBeenCalledWith(message, context)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
  })

  test('should handle null context as message only', () => {
    const message = 'Test error with null context'

    logger.error(message, null)

    expect(consoleErrorSpy).toHaveBeenCalledWith(message)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
  })
})
