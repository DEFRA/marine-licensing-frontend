export const createMockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  payload: {},
  headers: {},
  yar: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    flash: vi.fn(),
    commit: vi.fn()
  },
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  },
  ...overrides
})

export const createMockH = (overrides = {}) => ({
  view: vi.fn().mockReturnValue({ takeover: vi.fn() }),
  redirect: vi.fn().mockReturnValue({ takeover: vi.fn() }),
  ...overrides
})

// Mirrors the Boom error Wreck rejects with when an upstream returns 4xx/5xx.
export const createWreckResponseError = (statusCode, payload = {}) =>
  Object.assign(new Error(`Response Error: ${statusCode}`), {
    isBoom: true,
    output: { statusCode },
    data: { isResponseError: true, res: { statusCode }, payload }
  })
