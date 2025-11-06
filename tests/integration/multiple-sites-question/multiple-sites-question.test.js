import { vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { getByRole, getByText } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'

import {
  mockExemption,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'

import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('Multiple sites question page', () => {
  const getServer = setupTestServer()

  const mockExemptionData = {
    id: 'test-exemption-123',
    projectName: 'Test Project'
  }

  beforeEach(() => mockExemption(mockExemptionData))

  test('should display the multiple sites question page with correct content and multipleSiteDetails defaults to false', async () => {
    const { setExemptionCache } = mockExemption(mockExemptionData)
    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/does-your-project-involve-more-than-one-site'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Do you need to tell us about more than one site?'
      })
    ).toBeInTheDocument()
    expect(
      getByText(document, mockExemptionData.projectName)
    ).toBeInTheDocument()

    const yesRadio = getByRole(document, 'radio', { name: 'Yes' })
    const noRadio = getByRole(document, 'radio', { name: 'No' })

    expect(yesRadio).not.toBeChecked()
    expect(noRadio).not.toBeChecked()

    expect(setExemptionCache).not.toHaveBeenCalled()
  })

  test('should pre-populate radio button when multipleSiteDetails value exists in cache', async () => {
    const { setExemptionCache } = mockExemption({
      ...mockExemptionData,
      multipleSiteDetails: { multipleSitesEnabled: 'yes' }
    })

    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/does-your-project-involve-more-than-one-site'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const yesRadio = getByRole(document, 'radio', { name: 'Yes' })
    const noRadio = getByRole(document, 'radio', { name: 'No' })
    expect(yesRadio).toBeChecked()
    expect(noRadio).not.toBeChecked()

    expect(setExemptionCache).not.toHaveBeenCalled()
  })

  test('should not overwrite existing multipleSiteDetails value on GET route', async () => {
    const { setExemptionCache } = mockExemption({
      ...mockExemptionData,
      multipleSiteDetails: { multipleSitesEnabled: 'yes' }
    })

    const { statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/does-your-project-involve-more-than-one-site'
    })

    expect(statusCode).toBe(statusCodes.ok)

    expect(setExemptionCache).not.toHaveBeenCalled()
  })

  test('should have correct navigation links', async () => {
    const { result } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/does-your-project-involve-more-than-one-site'
    })

    const { document } = new JSDOM(result).window

    const continueButton = getByRole(document, 'button', { name: 'Continue' })
    expect(continueButton).toBeInTheDocument()

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute(
      'href',
      '/exemption/task-list?cancel=site-details'
    )

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute(
      'href',
      '/exemption/how-do-you-want-to-provide-the-coordinates'
    )
  })

  test('should stay on same page when continue is clicked without selection', async () => {
    const { result, statusCode } = await makePostRequest({
      url: '/exemption/does-your-project-involve-more-than-one-site',
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Do you need to tell us about more than one site?'
      })
    ).toBeInTheDocument()

    const expectedErrors = [
      {
        field: 'multipleSitesEnabled',
        message: 'Select whether you need to tell us about more than one site'
      }
    ]

    validateErrors(expectedErrors, document)

    expect(
      getByText(
        document,
        'Select whether you need to tell us about more than one site',
        {
          selector: '.govuk-error-message'
        }
      )
    ).toBeInTheDocument()
  })

  test('should navigate to Site Name page when YES is selected and set multipleSiteDetails to true', async () => {
    const { setExemptionCache } = mockExemption(mockExemptionData)
    const response = await makePostRequest({
      url: '/exemption/does-your-project-involve-more-than-one-site',
      server: getServer(),
      formData: {
        multipleSitesEnabled: 'yes'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/site-name')

    expect(setExemptionCache).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        ...mockExemptionData,
        multipleSiteDetails: { multipleSitesEnabled: true }
      }
    )
  })

  test('should redirect to coordinates entry choice when NO is selected and set multipleSiteDetails to false', async () => {
    const { setExemptionCache } = mockExemption(mockExemptionData)
    const response = await makePostRequest({
      url: '/exemption/does-your-project-involve-more-than-one-site',
      server: getServer(),
      formData: {
        multipleSitesEnabled: 'no'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/activity-dates')

    expect(setExemptionCache).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      {
        ...mockExemptionData,
        multipleSiteDetails: { multipleSitesEnabled: false }
      }
    )
  })

  test('should redirect to task list when cancel is clicked', async () => {
    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: '/exemption/does-your-project-involve-more-than-one-site'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute(
      'href',
      '/exemption/task-list?cancel=site-details'
    )
  })
})
