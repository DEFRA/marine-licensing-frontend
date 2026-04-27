import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { getByRole } from '@testing-library/dom'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinate-systems.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { updateMarineLicenceSiteDetails } from '~/src/server/common/helpers/marine-licence/session-cache/utils.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

const wgs84Coordinates = [
  { latitude: '51.507400', longitude: '-0.127800' },
  { latitude: '51.517500', longitude: '-0.137600' },
  { latitude: '51.527600', longitude: '-0.147700' }
]

const osgb36Coordinates = [
  { easting: '530000', northing: '181000' },
  { easting: '530100', northing: '181100' },
  { easting: '530200', northing: '181200' }
]

const mockWgs84Application = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinateSystem: COORDINATE_SYSTEMS.WGS84,
      coordinates: wgs84Coordinates
    }
  ]
}

const mockOsgb36Application = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
      coordinates: osgb36Coordinates
    }
  ]
}

describe('Enter multiple coordinates page (marine licence)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockWgs84Application)
    vi.mocked(updateMarineLicenceSiteDetails).mockResolvedValue(undefined)
  })

  const getRequest = () =>
    makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
      server: getServer()
    })

  const postRequest = (formData) =>
    makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES,
      server: getServer(),
      formData
    })

  test('should render WGS84 page correctly with pre-populated coordinates', async () => {
    const { result, statusCode } = await getRequest()

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        name: /Enter multiple sets of coordinates to mark the boundary of the site/
      })
    ).toBeInTheDocument()

    expect(document.querySelector('.govuk-caption-l').textContent.trim()).toBe(
      mockWgs84Application.projectName
    )

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
    )

    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
    )

    expect(
      document.querySelector('[name="coordinates[0][latitude]"]').value
    ).toBe(wgs84Coordinates[0].latitude)
    expect(
      document.querySelector('[name="coordinates[0][longitude]"]').value
    ).toBe(wgs84Coordinates[0].longitude)
  })

  test('should render OSGB36 page correctly with pre-populated coordinates', async () => {
    mockMarineLicence(mockOsgb36Application)

    const { result, statusCode } = await getRequest()

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      document.querySelector('[name="coordinates[0][easting]"]').value
    ).toBe(osgb36Coordinates[0].easting)
    expect(
      document.querySelector('[name="coordinates[0][northing]"]').value
    ).toBe(osgb36Coordinates[0].northing)
  })

  test('should render WGS84 page with empty inputs when cache has no coordinates', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinateSystem: COORDINATE_SYSTEMS.WGS84,
          coordinates: []
        }
      ]
    })

    const { result, statusCode } = await getRequest()

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window
    expect(
      document.querySelector('[name="coordinates[0][latitude]"]').value
    ).toBe('')
  })

  test('should redirect to review site details on valid WGS84 submission', async () => {
    const response = await postRequest({
      'coordinates[0][latitude]': '51.507400',
      'coordinates[0][longitude]': '-0.127800',
      'coordinates[1][latitude]': '51.517500',
      'coordinates[1][longitude]': '-0.137600',
      'coordinates[2][latitude]': '51.527600',
      'coordinates[2][longitude]': '-0.147700'
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_ENTER_MULTIPLE_COORDINATES
    )
  })

  test('should re-render with an added point when add button is submitted', async () => {
    const response = await postRequest({
      'coordinates[0][latitude]': '51.507400',
      'coordinates[0][longitude]': '-0.127800',
      'coordinates[1][latitude]': '51.517500',
      'coordinates[1][longitude]': '-0.137600',
      'coordinates[2][latitude]': '51.527600',
      'coordinates[2][longitude]': '-0.147700',
      add: 'add'
    })

    expect(response.statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(response.result).window
    expect(
      document.querySelector('[name="coordinates[3][latitude]"]')
    ).toBeTruthy()
  })

  test('should render validation error when fewer than 3 coordinate points provided', async () => {
    const response = await postRequest({
      'coordinates[0][latitude]': '51.507400',
      'coordinates[0][longitude]': '-0.127800'
    })

    expect(response.statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(response.result).window
    expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
    expect(document.body.textContent).toContain(
      'You must provide at least 3 coordinate points'
    )
  })

  test('should render validation error for non-numeric latitude', async () => {
    const response = await postRequest({
      'coordinates[0][latitude]': 'invalid',
      'coordinates[0][longitude]': '-0.127800',
      'coordinates[1][latitude]': '51.517500',
      'coordinates[1][longitude]': '-0.137600',
      'coordinates[2][latitude]': '51.527600',
      'coordinates[2][longitude]': '-0.147700'
    })

    expect(response.statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(response.result).window
    expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
    expect(document.body.textContent).toContain('must be a number')
  })

  test('should render validation error for empty latitude', async () => {
    const response = await postRequest({
      'coordinates[0][latitude]': '',
      'coordinates[0][longitude]': '-0.127800',
      'coordinates[1][latitude]': '51.517500',
      'coordinates[1][longitude]': '-0.137600',
      'coordinates[2][latitude]': '51.527600',
      'coordinates[2][longitude]': '-0.147700'
    })

    expect(response.statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(response.result).window
    expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
  })
})
