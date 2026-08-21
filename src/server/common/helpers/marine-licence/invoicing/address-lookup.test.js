import { vi } from 'vitest'
import Wreck from '@hapi/wreck'
import {
  lookupAddresses,
  normalisePostcode,
  filterByPropertyNameOrNumber
} from '#src/server/common/helpers/marine-licence/invoicing/address-lookup.js'
import { getAccessToken } from '#src/server/common/helpers/marine-licence/invoicing/address-lookup-token.js'
import {
  createMockRequest,
  createWreckResponseError
} from '#src/server/test-helpers/mocks/helpers.js'
import { config } from '#src/config/config.js'
import { getTraceId } from '@defra/hapi-tracing'

vi.mock('@hapi/wreck', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}))

vi.mock(
  '#src/server/common/helpers/marine-licence/invoicing/address-lookup-token.js',
  () => ({
    getAccessToken: vi.fn()
  })
)

vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: vi.fn()
}))

const tynesideHouse = {
  addressLine:
    'ENVIRONMENT AGENCY, TYNESIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE BUSINESS PARK, NEWCASTLE UPON TYNE, NE4 7AR',
  subBuildingName: 'ENVIRONMENT AGENCY',
  buildingName: 'TYNESIDE HOUSE',
  street: 'SKINNERBURN ROAD',
  town: 'NEWCASTLE UPON TYNE',
  postcode: 'NE4 7AR'
}

const quaysideHouse = {
  addressLine: '116, QUAYSIDE HOUSE, SKINNERBURN ROAD, NEWCASTLE UPON TYNE',
  buildingNumber: '116',
  buildingName: 'QUAYSIDE HOUSE',
  street: 'SKINNERBURN ROAD',
  town: 'NEWCASTLE UPON TYNE',
  postcode: 'NE4 7AR'
}

const mockLookupResponse = ({ statusCode = 200, payload = {} } = {}) => ({
  res: { statusCode },
  payload
})

describe('#addressLookup', () => {
  const request = createMockRequest()
  const apiUrl = config.get('addressLookup').apiUrl

  beforeEach(() => {
    Wreck.get.mockReset()
    getAccessToken.mockResolvedValue('a-valid-token')
    getTraceId.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#normalisePostcode', () => {
    test.each([
      ['ne4 7ar', 'NE47AR'],
      ['NE4 7AR', 'NE47AR'],
      ['  ne4   7ar  ', 'NE47AR']
    ])('should normalise "%s" to "%s"', (input, expected) => {
      expect(normalisePostcode(input)).toBe(expected)
    })

    test('should handle a missing postcode', () => {
      expect(normalisePostcode()).toBe('')
    })
  })

  describe('#filterByPropertyNameOrNumber', () => {
    const results = [tynesideHouse, quaysideHouse]

    test('should return all results when no search term is given', () => {
      expect(filterByPropertyNameOrNumber(results, '')).toEqual(results)
      expect(filterByPropertyNameOrNumber(results, undefined)).toEqual(results)
    })

    test('should filter by building name regardless of case', () => {
      expect(filterByPropertyNameOrNumber(results, 'tyneside house')).toEqual([
        tynesideHouse
      ])
    })

    test('should filter by sub building name', () => {
      expect(
        filterByPropertyNameOrNumber(results, 'Environment Agency')
      ).toEqual([tynesideHouse])
    })

    test('should filter by building number', () => {
      expect(filterByPropertyNameOrNumber(results, '116')).toEqual([
        quaysideHouse
      ])
    })

    test('should return an empty array when nothing matches', () => {
      expect(filterByPropertyNameOrNumber(results, 'The Mill')).toEqual([])
    })

    test.each(['7', 'skinnerburn', 'newcastle'])(
      'should not match "%s" from the full address line',
      (searchTerm) => {
        expect(filterByPropertyNameOrNumber(results, searchTerm)).toEqual([])
      }
    )
  })

  describe('#lookupAddresses', () => {
    test('should call the lookup API with a normalised, encoded postcode and a bearer token', async () => {
      Wreck.get.mockResolvedValue(
        mockLookupResponse({ payload: { results: [tynesideHouse] } })
      )

      await lookupAddresses(request, { postcode: 'ne4 7ar' })

      const { maxResults } = config.get('addressLookup')

      expect(Wreck.get).toHaveBeenCalledWith(
        `${apiUrl}?postcode=NE47AR&maxresults=${maxResults}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer a-valid-token'
          },
          json: true,
          timeout: config.get('addressLookup').timeout
        }
      )
    })

    test('should propagate the CDP tracing header when a trace id is present', async () => {
      getTraceId.mockReturnValue('trace-abc-123')
      Wreck.get.mockResolvedValue(
        mockLookupResponse({ payload: { results: [] } })
      )

      await lookupAddresses(request, { postcode: 'NE4 7AR' })

      expect(Wreck.get.mock.calls[0][1].headers).toEqual(
        expect.objectContaining({
          [config.get('tracing.header')]: 'trace-abc-123'
        })
      )
    })

    test('should return the results from a successful response', async () => {
      Wreck.get.mockResolvedValue(
        mockLookupResponse({
          payload: { results: [tynesideHouse, quaysideHouse] }
        })
      )

      const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

      expect(result).toEqual({ results: [tynesideHouse, quaysideHouse] })
    })

    test('should filter the results by property name or number', async () => {
      Wreck.get.mockResolvedValue(
        mockLookupResponse({
          payload: { results: [tynesideHouse, quaysideHouse] }
        })
      )

      const result = await lookupAddresses(request, {
        postcode: 'NE4 7AR',
        propertyNameOrNumber: 'Tyneside House'
      })

      expect(result).toEqual({ results: [tynesideHouse] })
    })

    test('should return no results for a 204 No Content response', async () => {
      // A 204 carries no body, so with json: true Wreck hands back the raw
      // empty buffer rather than a parsed object.
      Wreck.get.mockResolvedValue(
        mockLookupResponse({ statusCode: 204, payload: Buffer.alloc(0) })
      )

      const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

      expect(result).toEqual({ results: [] })
    })

    describe('truncated result sets', () => {
      const payloadWithTotal = (results, totalResults) => ({
        header: { totalResults: String(totalResults) },
        results
      })

      test('should flag truncation when the API has more addresses than it returned', async () => {
        Wreck.get.mockResolvedValue(
          mockLookupResponse({
            payload: payloadWithTotal([tynesideHouse, quaysideHouse], 250)
          })
        )

        const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

        expect(result.truncated).toBe(true)
      })

      test('should not flag truncation when every address was returned', async () => {
        Wreck.get.mockResolvedValue(
          mockLookupResponse({
            payload: payloadWithTotal([tynesideHouse, quaysideHouse], 2)
          })
        )

        const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

        expect(result).toEqual({ results: [tynesideHouse, quaysideHouse] })
        expect(result.truncated).toBeUndefined()
      })

      test('should not flag truncation when the response has no header', async () => {
        Wreck.get.mockResolvedValue(
          mockLookupResponse({ payload: { results: [tynesideHouse] } })
        )

        const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

        expect(result.truncated).toBeUndefined()
      })

      test('should keep the truncation flag when a property filter matches nothing', async () => {
        Wreck.get.mockResolvedValue(
          mockLookupResponse({
            payload: payloadWithTotal([tynesideHouse, quaysideHouse], 250)
          })
        )

        const result = await lookupAddresses(request, {
          postcode: 'NE4 7AR',
          propertyNameOrNumber: 'Nowhere House'
        })

        expect(result).toEqual({ results: [], truncated: true })
      })
    })

    test('should return no results when the response has no results array', async () => {
      Wreck.get.mockResolvedValue(
        mockLookupResponse({ payload: { header: {} } })
      )

      const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

      expect(result).toEqual({ results: [] })
    })

    test('should return an error when the API responds with a failure status', async () => {
      Wreck.get.mockRejectedValue(createWreckResponseError(500))

      const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

      expect(result).toEqual({ results: [], error: true })
      expect(request.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: { message: `statusCode=500 apiUrl=${apiUrl}` }
        }),
        'Postcode lookup request failed'
      )
    })

    test('should log the called URL alongside the status code so a wrong URL is obvious', async () => {
      Wreck.get.mockRejectedValue(createWreckResponseError(404))

      const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

      expect(result).toEqual({ results: [], error: true })
      expect(request.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant: { message: `statusCode=404 apiUrl=${apiUrl}` }
        }),
        'Postcode lookup request failed'
      )
    })

    test('should return an error when a 200 response is not JSON', async () => {
      // Wreck hands back a raw buffer when the content-type is not JSON - a proxy error
      // page, say - which must not be reported as "no addresses found".
      Wreck.get.mockResolvedValue(
        mockLookupResponse({ payload: Buffer.from('<html>Bad Gateway</html>') })
      )

      const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

      expect(result).toEqual({ results: [], error: true })
    })

    test('should return an error when the request throws', async () => {
      const error = new Error('network down')
      Wreck.get.mockRejectedValue(error)

      const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

      expect(result).toEqual({ results: [], error: true })
      expect(request.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: error }),
        'Postcode lookup request failed'
      )
    })

    describe('authentication', () => {
      test('should not call the API when no token can be obtained', async () => {
        getAccessToken.mockResolvedValue(null)

        const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

        expect(result).toEqual({ results: [], error: true })
        expect(Wreck.get).not.toHaveBeenCalled()
      })

      test('should refresh the token and retry once on a 401', async () => {
        getAccessToken
          .mockResolvedValueOnce('a-stale-token')
          .mockResolvedValueOnce('a-fresh-token')

        Wreck.get
          .mockRejectedValueOnce(createWreckResponseError(401))
          .mockResolvedValueOnce(
            mockLookupResponse({ payload: { results: [tynesideHouse] } })
          )

        const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

        expect(result).toEqual({ results: [tynesideHouse] })
        expect(Wreck.get).toHaveBeenCalledTimes(2)
        expect(getAccessToken).toHaveBeenNthCalledWith(2, request, {
          forceRefresh: true
        })
        expect(Wreck.get.mock.calls[1][1].headers.Authorization).toBe(
          'Bearer a-fresh-token'
        )
      })

      test('should return an error when the retried request is also unauthorised', async () => {
        Wreck.get.mockRejectedValue(createWreckResponseError(401))

        const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

        expect(result).toEqual({ results: [], error: true })
        expect(Wreck.get).toHaveBeenCalledTimes(2)
        expect(request.logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            tenant: { message: `statusCode=401 apiUrl=${apiUrl}` }
          }),
          'Postcode lookup request failed'
        )
      })

      test('should return an error when the token refresh fails after a 401', async () => {
        getAccessToken
          .mockResolvedValueOnce('a-stale-token')
          .mockResolvedValueOnce(null)

        Wreck.get.mockRejectedValue(createWreckResponseError(401))

        const result = await lookupAddresses(request, { postcode: 'NE4 7AR' })

        expect(result).toEqual({ results: [], error: true })
        expect(Wreck.get).toHaveBeenCalledTimes(1)
      })
    })
  })
})
