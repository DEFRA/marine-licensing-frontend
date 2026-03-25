import { getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'

export function sharedChooseFileTypeTests({
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
        name: 'Which type of file do you want to upload?'
      })
    ).toBeInTheDocument()

    expect(getByText(document, projectName)).toBeInTheDocument()

    expect(
      getByRole(document, 'radio', { name: 'Shapefile' })
    ).toBeInTheDocument()

    expect(getByRole(document, 'radio', { name: 'KML' })).toBeInTheDocument()

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
          field: 'fileUploadType',
          message: 'Select which type of file you want to upload'
        }
      ],
      document
    )
  })
}
