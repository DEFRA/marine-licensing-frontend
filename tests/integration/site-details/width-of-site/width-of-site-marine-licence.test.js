import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { getByRole } from '@testing-library/dom'
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

const mockApplicationWithWidth = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      ...mockMarineLicenceApplication.siteDetails[0],
      circleWidth: '500'
    }
  ]
}

describe('Width of site page (marine licence)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockApplicationWithWidth)
    vi.mocked(updateMarineLicenceSiteDetails).mockResolvedValue(undefined)
  })

  const getRequest = () =>
    makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
      server: getServer()
    })

  const postRequest = (formData) =>
    makePostRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE,
      server: getServer(),
      formData
    })

  test('should render the page correctly and pre-populate width from cache', async () => {
    const { result, statusCode } = await getRequest()

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        name: /Enter the width of the circular site in metres/
      })
    ).toBeInTheDocument()

    expect(document.querySelector('.govuk-caption-l').textContent.trim()).toBe(
      mockApplicationWithWidth.projectName
    )

    expect(document.querySelector('#width').value).toBe('500')

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CIRCLE_CENTRE_POINT
    )

    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
    )
  })

  test('should redirect back to same page on valid submission', async () => {
    const response = await postRequest({ width: '250' })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WIDTH_OF_SITE
    )
  })

  test('should render validation error when width is empty', async () => {
    const response = await postRequest({ width: '' })

    expect(response.statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(response.result).window

    expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
    expect(document.body.textContent).toContain(
      'Enter the width of the circular site in metres'
    )
  })

  test('should render validation error for non-numeric input', async () => {
    const response = await postRequest({ width: 'abc' })

    expect(response.statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(response.result).window

    expect(document.body.textContent).toContain(
      'The width of the circular site must be a number'
    )
  })

  test('should render validation error for fractional input', async () => {
    const response = await postRequest({ width: '10.5' })

    expect(response.statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(response.result).window

    expect(document.body.textContent).toContain(
      'The width of the circular site must be a whole number, like 10'
    )
  })

  test('should render validation error for zero or negative input', async () => {
    const response = await postRequest({ width: '0' })

    expect(response.statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(response.result).window

    expect(document.body.textContent).toContain(
      'The width of the circular site must be 1 metre or more'
    )
  })
})
