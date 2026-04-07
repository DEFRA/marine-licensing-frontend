import { JSDOM } from 'jsdom'
import { getByLabelText, getByRole, getByText } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { validateErrors } from '../../shared/expect-utils.js'
import {
  makeGetRequest,
  makePostRequest
} from '~/src/server/test-helpers/server-requests.js'

/**
 * @param {{
 *   getServer: () => import('@hapi/hapi').Server,
 *   url: string,
 *   setupMock: (siteDetails?: object[]) => void,
 *   projectName: string,
 *   cancelLinkHref: string,
 *   backLinkHref: string
 * }} options
 */
export function sharedSiteNameTests({
  getServer,
  url,
  setupMock,
  projectName,
  cancelLinkHref,
  backLinkHref
}) {
  test('should display the site name page with correct content', async () => {
    setupMock([{}])

    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Site name'
      })
    ).toBeInTheDocument()
    expect(getByText(document, projectName)).toBeInTheDocument()
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
  })

  test('should pre-populate input when siteName value exists in cache', async () => {
    setupMock([{ siteName: 'Test Site' }])

    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    const siteNameInput = getByLabelText(document, 'Site name', {
      exact: false
    })
    expect(siteNameInput).toHaveValue('Test Site')
  })

  test('should have correct navigation links', async () => {
    setupMock([{}])

    const { result } = await makeGetRequest({
      server: getServer(),
      url
    })

    const { document } = new JSDOM(result).window

    const continueButton = getByRole(document, 'button', { name: 'Continue' })
    expect(continueButton).toBeInTheDocument()

    const cancelLink = getByRole(document, 'link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute('href', cancelLinkHref)

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', backLinkHref)
  })

  test('should stay on same page when continue is clicked without entering site name', async () => {
    setupMock([{}])

    const { result, statusCode } = await makePostRequest({
      url,
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

    validateErrors(
      [{ field: 'siteName', message: 'Enter the site name' }],
      document
    )
  })

  test('should stay on same page when site name is too long', async () => {
    setupMock([{}])

    const siteName = 'A'.repeat(251)

    const { result, statusCode } = await makePostRequest({
      url,
      server: getServer(),
      formData: { siteName }
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

    validateErrors(
      [
        {
          field: 'siteName',
          message: 'Site name should be 250 characters or less'
        }
      ],
      document
    )
  })
}
