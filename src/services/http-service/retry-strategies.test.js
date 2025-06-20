import {
  RetryStrategy,
  ExponentialBackoffStrategy,
  LinearBackoffStrategy,
  FixedDelayStrategy,
  CustomStrategy
} from './retry-strategies.js'

describe('RetryStrategy', () => {
  describe('factory method', () => {
    it('should create exponential backoff strategy', () => {
      const strategy = RetryStrategy.create('exponential')
      expect(strategy).toBeInstanceOf(ExponentialBackoffStrategy)
    })

    it('should create linear backoff strategy', () => {
      const strategy = RetryStrategy.create('linear')
      expect(strategy).toBeInstanceOf(LinearBackoffStrategy)
    })

    it('should create fixed delay strategy', () => {
      const strategy = RetryStrategy.create('fixed')
      expect(strategy).toBeInstanceOf(FixedDelayStrategy)
    })

    it('should create custom strategy', () => {
      const delayFunction = (attempt) => attempt * 100
      const strategy = RetryStrategy.create('custom', { delayFunction })
      expect(strategy).toBeInstanceOf(CustomStrategy)
    })

    it('should throw error for unknown strategy', () => {
      expect(() => RetryStrategy.create('unknown')).toThrow(
        'Unknown retry strategy: unknown'
      )
    })
  })

  describe('ExponentialBackoffStrategy', () => {
    it('should calculate exponential delays', () => {
      const strategy = new ExponentialBackoffStrategy({
        baseDelay: 1000,
        multiplier: 2,
        jitter: false
      })

      expect(strategy.getDelay(1)).toBe(1000)
      expect(strategy.getDelay(2)).toBe(2000)
      expect(strategy.getDelay(3)).toBe(4000)
    })

    it('should respect maximum delay', () => {
      const strategy = new ExponentialBackoffStrategy({
        baseDelay: 1000,
        multiplier: 2,
        maxDelay: 3000,
        jitter: false
      })

      expect(strategy.getDelay(3)).toBe(3000) // Would be 4000 without max
      expect(strategy.getDelay(4)).toBe(3000)
    })

    it('should apply jitter when enabled', () => {
      const strategy = new ExponentialBackoffStrategy({
        baseDelay: 1000,
        multiplier: 2,
        jitter: true
      })

      const delay1 = strategy.getDelay(2)
      const delay2 = strategy.getDelay(2)

      // With jitter, delays should be between 1000 and 2000
      expect(delay1).toBeGreaterThanOrEqual(1000)
      expect(delay1).toBeLessThanOrEqual(2000)
      expect(delay2).toBeGreaterThanOrEqual(1000)
      expect(delay2).toBeLessThanOrEqual(2000)
    })
  })

  describe('LinearBackoffStrategy', () => {
    it('should calculate linear delays', () => {
      const strategy = new LinearBackoffStrategy({
        baseDelay: 1000,
        increment: 500
      })

      expect(strategy.getDelay(1)).toBe(1000)
      expect(strategy.getDelay(2)).toBe(1500)
      expect(strategy.getDelay(3)).toBe(2000)
    })
  })

  describe('FixedDelayStrategy', () => {
    it('should return fixed delay', () => {
      const strategy = new FixedDelayStrategy({ baseDelay: 2000 })

      expect(strategy.getDelay(1)).toBe(2000)
      expect(strategy.getDelay(2)).toBe(2000)
      expect(strategy.getDelay(3)).toBe(2000)
    })
  })

  describe('CustomStrategy', () => {
    it('should use custom delay function', () => {
      const delayFunction = (attempt, baseDelay) =>
        baseDelay * attempt * attempt
      const strategy = new CustomStrategy({
        baseDelay: 100,
        delayFunction
      })

      expect(strategy.getDelay(1)).toBe(100) // 100 * 1 * 1
      expect(strategy.getDelay(2)).toBe(400) // 100 * 2 * 2
      expect(strategy.getDelay(3)).toBe(900) // 100 * 3 * 3
    })

    it('should throw error without delay function', () => {
      expect(() => new CustomStrategy()).toThrow(
        'CustomStrategy requires a delayFunction'
      )
    })
  })
})
