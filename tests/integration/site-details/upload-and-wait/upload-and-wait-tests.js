import { getByRole } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

/**
 * @param {{
 *   loadPageWithStatus: (status: string) => Promise<Document>,
 *   getRedirectResponse: () => Promise<{ statusCode: number, headers: { location: string } }>,
 *   fileUploadRoute: string
 * }} options
 */
export function sharedUploadAndWaitTests({
  loadPageWithStatus,
  getRedirectResponse,
  fileUploadRoute
}) {
  test('should show loading spinner when status is pending', async () => {
    const document = await loadPageWithStatus('pending')

    expect(document.querySelector('.app-loading-spinner')).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', {
        level: 1,
        name: 'Checking your file...'
      })
    ).toBeInTheDocument()
  })

  test('should show loading spinner when status is scanning', async () => {
    const document = await loadPageWithStatus('scanning')

    expect(document.querySelector('.app-loading-spinner')).toBeInTheDocument()
  })

  test('should include meta refresh tag when processing', async () => {
    const document = await loadPageWithStatus('pending')

    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]')
    expect(metaRefresh).toBeInTheDocument()
    expect(metaRefresh.getAttribute('content')).toBe('2')
  })

  test('should redirect to file upload when no upload config is present', async () => {
    const { statusCode, headers } = await getRedirectResponse()

    expect(statusCode).toBe(statusCodes.redirect)
    expect(headers.location).toBe(fileUploadRoute)
  })
}
