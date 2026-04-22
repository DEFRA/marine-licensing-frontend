import { getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'

export function sharedCoordinateSystemTests({
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
        name: 'Which coordinate system do you want to use?'
      })
    ).toBeInTheDocument()

    expect(getByText(document, projectName)).toBeInTheDocument()

    expect(
      getByRole(document, 'radio', {
        name: /WGS84 \(World Geodetic System 1984\)/
      })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'radio', {
        name: /British National Grid \(OSGB36\)/
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
          field: 'coordinateSystem',
          message: 'Select which coordinate system you want to use'
        }
      ],
      document
    )
  })
}
