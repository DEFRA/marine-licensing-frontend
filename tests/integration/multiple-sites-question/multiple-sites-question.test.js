import { JSDOM } from 'jsdom'
import { getByRole, getByText } from '@testing-library/dom'
import { createServer } from '~/src/server/index.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'

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
  })

  test('should display the multiple sites question page with correct content', async () => {
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

    // Check radio buttons exist but none selected
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

    // Should still be on the same page
    expect(
      getByRole(document, 'heading', {
        name: 'Do you need to tell us about more than one site?'
      })
    ).toBeInTheDocument()

    // Should show error message
    expect(
      getByText(
        document,
        'Select whether you need to tell us about more than one site'
      )
    ).toBeInTheDocument()
  })

  test('should stay on same page when YES is selected', async () => {
    const { result, statusCode } = await server.inject({
      method: 'POST',
      url: '/exemption/does-your-project-involve-more-than-one-site',
      payload: {
        multipleSites: 'yes'
      }
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    // Should still be on the same page (as per AC3 - navigation will be covered later)
    expect(
      getByRole(document, 'heading', {
        name: 'Do you need to tell us about more than one site?'
      })
    ).toBeInTheDocument()
  })

  test('should redirect to coordinates entry choice when NO is selected', async () => {
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
