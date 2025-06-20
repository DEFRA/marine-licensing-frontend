import {
  getHttpService,
  createHttpService,
  HttpService,
  HttpServiceConfig
} from './index.js'

// Mock the HttpService constructor
jest.mock('./http-service.js')
jest.mock('./config.js')

describe('HttpService Index', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getHttpService', () => {
    it('should create singleton instance on first call', () => {
      const MockHttpService = HttpService
      const MockConfig = HttpServiceConfig

      MockConfig.forEnvironment = jest.fn().mockReturnValue({ timeout: 30000 })
      MockHttpService.mockImplementation(() => ({ config: { timeout: 30000 } }))

      const service1 = getHttpService()
      const service2 = getHttpService()

      expect(service1).toBe(service2) // Same instance
      expect(MockHttpService).toHaveBeenCalledTimes(1)
      expect(MockConfig.forEnvironment).toHaveBeenCalledTimes(1)
    })

    it('should create new instance when config provided', () => {
      const MockHttpService = HttpService
      MockHttpService.mockImplementation(() => ({ config: { timeout: 15000 } }))

      const customConfig = { timeout: 15000 }
      getHttpService(customConfig)

      expect(MockHttpService).toHaveBeenCalledWith(customConfig)
    })
  })

  describe('createHttpService', () => {
    it('should create new instance every time', () => {
      const MockHttpService = HttpService
      MockHttpService.mockImplementation(() => ({}))

      createHttpService({ timeout: 10000 })
      createHttpService({ timeout: 20000 })

      expect(MockHttpService).toHaveBeenCalledTimes(2)
      expect(MockHttpService).toHaveBeenNthCalledWith(1, { timeout: 10000 })
      expect(MockHttpService).toHaveBeenNthCalledWith(2, { timeout: 20000 })
    })

    it('should create instance with empty config by default', () => {
      const MockHttpService = HttpService
      MockHttpService.mockImplementation(() => ({}))

      createHttpService()

      expect(MockHttpService).toHaveBeenCalledWith({})
    })
  })
})
