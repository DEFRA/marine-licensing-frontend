import { JSDOM } from 'jsdom'
import { getByRole, getByText } from '@testing-library/dom'
import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails,
  setExemptionCache
} from '~/src/server/common/helpers/session-cache/utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('Multiple sites question page', () => {
  let server

  const mockExemption = {
    id: 'test-exemption-123',
    projectName: 'Test Project'
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    jest.mocked(getExemptionCache).mockReturnValue(mockExemption)
    jest.mocked(updateExemptionSiteDetails).mockReturnValue({})
    jest.mocked(setExemptionCache).mockReturnValue({})
  })

  test('should display the multiple sites question page with correct content and multiSite defaults to false', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/does-your-project-involve-more-than-one-site'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        name: 'Do you need to tell us about more than one site?'
      })
    ).toBeInTheDocument()
    expect(getByText(document, mockExemption.projectName)).toBeInTheDocument()

    const yesRadio = document.querySelector('input[value="yes"]')
    const noRadio = document.querySelector('input[value="no"]')
    expect(yesRadio).toBeInTheDocument()
    expect(noRadio).toBeInTheDocument()
    expect(yesRadio).not.toBeChecked()
    expect(noRadio).not.toBeChecked()

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Cancel' })).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toBeInTheDocument()

    expect(setExemptionCache).not.toHaveBeenCalled()
  })

  test('should pre-populate radio button when multiSite value exists in cache', async () => {
    jest.mocked(getExemptionCache).mockReturnValue({
      ...mockExemption,
      multiSite: true
    })

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/does-your-project-involve-more-than-one-site'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const yesRadio = document.querySelector('input[value="yes"]')
    const noRadio = document.querySelector('input[value="no"]')
    expect(yesRadio).toBeChecked()
    expect(noRadio).not.toBeChecked()

    expect(setExemptionCache).not.toHaveBeenCalled()
  })

  test('should not overwrite existing multiSite value on GET route', async () => {
    jest.mocked(getExemptionCache).mockReturnValue({
      ...mockExemption,
      multiSite: true
    })

    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/does-your-project-involve-more-than-one-site'
    })

    expect(statusCode).toBe(statusCodes.ok)

    expect(setExemptionCache).not.toHaveBeenCalled()
  })

  test('should have correct navigation links', async () => {
    const { result } = await server.inject({
      method: 'GET',
      url: '/exemption/does-your-project-involve-more-than-one-site'
    })

    const { document } = new JSDOM(result).window

    const continueButton = getByRole(document, 'button', { name: 'Continue' })
    expect(continueButton).toBeInTheDocument()

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute('href', '/exemption/task-list')

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute(
      'href',
      '/exemption/how-do-you-want-to-provide-the-coordinates'
    )
  })

  test('should stay on same page when continue is clicked without selection', async () => {
    const { result, statusCode } = await server.inject({
      method: 'POST',
      url: '/exemption/does-your-project-involve-more-than-one-site',
      payload: {}
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        name: 'Do you need to tell us about more than one site?'
      })
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        'Select whether you need to tell us about more than one site'
      )
    ).toBeInTheDocument()
  })

  test('should stay on same page when YES is selected and set multiSite to true', async () => {
    const { result, statusCode } = await server.inject({
      method: 'POST',
      url: '/exemption/does-your-project-involve-more-than-one-site',
      payload: {
        multipleSites: 'yes'
      }
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        name: 'Do you need to tell us about more than one site?'
      })
    ).toBeInTheDocument()

    expect(setExemptionCache).toHaveBeenCalledWith(expect.any(Object), {
      ...mockExemption,
      multiSite: true
    })
  })

  test('should redirect to coordinates entry choice when NO is selected and set multiSite to false', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/exemption/does-your-project-involve-more-than-one-site',
      payload: {
        multipleSites: 'no'
      }
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      '/exemption/how-do-you-want-to-enter-the-coordinates'
    )

    expect(setExemptionCache).toHaveBeenCalledWith(expect.any(Object), {
      ...mockExemption,
      multiSite: false
    })
  })

  test('should redirect to task list when cancel is clicked', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/does-your-project-involve-more-than-one-site'
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute('href', '/exemption/task-list')
  })
})
