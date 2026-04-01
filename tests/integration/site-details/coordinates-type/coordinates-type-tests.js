import { getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'

export function sharedCoordinatesTypeTests({
  getRequest,
  postRequest,
  projectName,
  backHref,
  cancelHref
}) {
  test('should render the page with correct content', async () => {
    const { result, statusCode } = await getRequest()

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        name: 'How do you want to provide the site location?'
      })
    ).toBeInTheDocument()

    expect(getByText(document, projectName)).toBeInTheDocument()

    expect(
      getByRole(document, 'radio', {
        name: 'Upload a file with the coordinates of the site'
      })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'radio', {
        name: 'Enter the coordinates of the site manually'
      })
    ).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      backHref
    )

    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      cancelHref
    )
  })

  test('should show a validation error when no option is selected', async () => {
    const { result, statusCode } = await postRequest({ formData: {} })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    validateErrors(
      [
        {
          field: 'coordinatesType',
          message: 'Select how you want to provide the site location'
        }
      ],
      document
    )
  })
}
