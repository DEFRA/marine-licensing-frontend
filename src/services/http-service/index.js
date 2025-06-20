/**
 * Main export file for HTTP service
 */

import { HttpService } from './http-service.js'
import { HttpServiceConfig } from './config.js'
import { RetryStrategy } from './retry-strategies.js'
import { HttpError, RetryableError, TimeoutError } from './errors.js'

// Create singleton instance for common use
let defaultInstance = null

/**
 * Get or create default HTTP service instance
 */
export function getHttpService(config = null) {
  if (!defaultInstance || config) {
    const serviceConfig = config ?? HttpServiceConfig.forEnvironment()
    defaultInstance = new HttpService(serviceConfig)
  }
  return defaultInstance
}

/**
 * Create a new HTTP service instance
 */
export function createHttpService(config = {}) {
  return new HttpService(config)
}

// Named exports
export {
  HttpService,
  HttpServiceConfig,
  RetryStrategy,
  HttpError,
  RetryableError,
  TimeoutError
}

// Default export
export default {
  HttpService,
  HttpServiceConfig,
  RetryStrategy,
  HttpError,
  RetryableError,
  TimeoutError,
  getHttpService,
  createHttpService
}
