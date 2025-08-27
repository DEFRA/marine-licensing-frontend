import { JSDOM } from 'jsdom'
import { getByLabelText, getByRole, getByText } from '@testing-library/dom'
import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'
import { validateErrors } from '../utils/utils.test.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('Site name page', () => {
  let server

  const mockExemption = {
    id: 'test-exemption-123',
    projectName: 'Test Project'
  }

  jest.mocked(getExemptionCache).mockReturnValue(mockExemption)
  jest.mocked(updateExemptionSiteDetails).mockReturnValue({})
  jest.mocked(setExemptionCache).mockReturnValue({})

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  test('should display the site name page with correct content', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
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
    expect(getByText(document, mockExemption.projectName)).toBeInTheDocument()
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
    jest.mocked(getExemptionCache).mockReturnValue({
      ...mockExemption,
      siteDetails: { ...mockExemption.siteDetails, siteName: 'Test Site' }
    })

    const { result, statusCode } = await server.inject({
      method: 'GET',
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
    const { result } = await server.inject({
      method: 'GET',
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
    const { result, statusCode } = await server.inject({
      method: 'POST',
      url: '/exemption/site-name',
      payload: {}
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

    const { result, statusCode } = await server.inject({
      method: 'POST',
      url: '/exemption/site-name',
      payload: {
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
    const response = await server.inject({
      method: 'POST',
      url: '/exemption/site-name',
      payload: {
        siteName: 'Test Site Name'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe('/exemption/same-activity-dates')

    expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
      expect.any(Object),
      'siteName',
      'Test Site Name'
    )
  })

  test('should redirect to task list when cancel is clicked', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/site-name'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute('href', '/exemption/task-list')
  })
})
