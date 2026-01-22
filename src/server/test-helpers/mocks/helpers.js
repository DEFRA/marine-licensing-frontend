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
