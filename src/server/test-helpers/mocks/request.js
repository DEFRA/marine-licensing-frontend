export const mockRequest = {
  payload: {},
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  },
  yar: {
    clear: vi.fn(),
    flash: vi.fn()
  }
}
