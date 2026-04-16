import { describe, test, expect, vi, afterEach } from 'vitest'
import { config } from '#src/config/config.js'
import { router } from '#src/server/router.js'

describe('router', () => {
  afterEach(() => {
    config.set('selfService.enabled', false)
  })

  test('registers self-service plugins when ENABLE_SELF_SERVICE is true', async () => {
    config.set('selfService.enabled', true)

    const registered = []
    const server = {
      register: vi.fn(async (plugins) => {
        for (const p of [plugins].flat()) {
          registered.push(p.plugin?.name ?? p.name ?? 'unknown')
        }
      })
    }

    await router.plugin.register(server)

    expect(registered).toContain('journeySelfServiceStart')
    expect(registered).toContain('journeySelfServiceQuestion')
  })

  test('does not register self-service plugins when ENABLE_SELF_SERVICE is false', async () => {
    config.set('selfService.enabled', false)

    const registered = []
    const server = {
      register: vi.fn(async (plugins) => {
        for (const p of [plugins].flat()) {
          registered.push(p.plugin?.name ?? p.name ?? 'unknown')
        }
      })
    }

    await router.plugin.register(server)

    expect(registered).not.toContain('journeySelfServiceStart')
    expect(registered).not.toContain('journeySelfServiceQuestion')
  })
})
