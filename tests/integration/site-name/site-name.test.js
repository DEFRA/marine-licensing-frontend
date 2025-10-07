import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { getByLabelText, getByRole, getByText } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import { validateErrors } from '../shared/expect-utils.js'

import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'

import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('Site name page', () => {
  const getServer = setupTestServer()

  const mockExemptionData = {
    id: 'test-exemption-123',
    projectName: 'Test Project',
    siteDetails: [{}]
  }

  beforeEach(() => mockExemption(mockExemptionData))

  test('should display the site name page with correct content', async () => {
    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/site-name'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Site name'
      })
    ).toBeInTheDocument()
    expect(
      getByText(document, mockExemptionData.projectName)
    ).toBeInTheDocument()
    expect(getByText(document, 'Site 1')).toBeInTheDocument()

    const siteNameInput = getByLabelText(document, 'Site name', {
      exact: false
    })
    expect(siteNameInput).toHaveAttribute('type', 'text')

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Cancel' })).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toBeInTheDocument()

    expect(setExemptionCache).not.toHaveBeenCalled()
  })

  test('should pre-populate input when siteName value exists in cache', async () => {
    const { setExemptionCache } = mockExemption({
      ...mockExemptionData,
      siteDetails: [
        { ...mockExemptionData.siteDetails[0], siteName: 'Test Site' }
      ]
    })

    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/site-name'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const siteNameInput = getByLabelText(document, 'Site name', {
      exact: false
    })
    expect(siteNameInput).toHaveValue('Test Site')

    expect(setExemptionCache).not.toHaveBeenCalled()
  })

  test('should have correct navigation links', async () => {
    const { result } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/site-name'
    })

    const { document } = new JSDOM(result).window

    const continueButton = getByRole(document, 'button', { name: 'Continue' })
    expect(continueButton).toBeInTheDocument()

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute('href', '/exemption/task-list')

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute(
      'href',
      '/exemption/does-your-project-involve-more-than-one-site'
    )
  })

  test('should stay on same page when continue is clicked without entering site name', async () => {
    const { result, statusCode } = await makePostRequest({
      url: '/exemption/site-name',
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Site name'
      })
    ).toBeInTheDocument()
    expect(getByText(document, 'Site 1')).toBeInTheDocument()

    const expectedErrors = [
      {
        field: 'siteName',
        message: 'Enter the site name'
      }
    ]

    validateErrors(expectedErrors, document)
  })

  test('should stay on same page when site name is too long', async () => {
    const siteName = 'A'.repeat(251)

    const { result, statusCode } = await makePostRequest({
      url: '/exemption/site-name',
      server: getServer(),
      formData: {
        siteName
      }
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Site name'
      })
    ).toBeInTheDocument()
    expect(getByText(document, 'Site 1')).toBeInTheDocument()

    const expectedErrors = [
      {
        field: 'siteName',
        message: 'Site name should be 250 characters or less'
      }
    ]

    validateErrors(expectedErrors, document)
  })

  test('should redirect to same activity dates when valid site name is submitted', async () => {
    const { updateExemptionSiteDetails } = mockExemption(mockExemptionData)
    const response = await makePostRequest({
      url: '/exemption/site-name',
      server: getServer(),
      formData: {
        siteName: 'Test Site Name'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/same-activity-dates')

    expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      0,
      'siteName',
      'Test Site Name'
    )
  })

  test('should redirect to task list when cancel is clicked', async () => {
    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/site-name'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute('href', '/exemption/task-list')
  })

  test('should show correct content for multiple site flow', async () => {
    mockExemption({
      mockExemption: mockExemptionData,
      siteDetails: [...mockExemptionData.siteDetails, {}]
    })

    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/site-name?site=2'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(getByText(document, 'Site 2')).toBeInTheDocument()

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', '/exemption/review-site-details')
  })
})
