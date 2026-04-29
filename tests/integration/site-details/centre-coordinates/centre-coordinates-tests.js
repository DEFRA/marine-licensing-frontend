import { getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

export function sharedCentreCoordinatesTests({
  getRequest,
  postRequest,
  projectName,
  backHref,
  cancelHref,
  latitude,
  longitude,
  redirectHref,
  setupOsgb36,
  eastings,
  northings
}) {
  test('should render the page correctly and pre-populate coordinates from cache', async () => {
    const { result, statusCode } = await getRequest()

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        name: /Enter the coordinates at the centre point of the site/
      })
    ).toBeInTheDocument()

    expect(getByText(document, projectName)).toBeInTheDocument()

    expect(document.querySelector('#latitude').value).toBe(latitude)
    expect(document.querySelector('#longitude').value).toBe(longitude)

    expect(
      getByText(document, 'Help with latitude and longitude formats')
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

  test('should redirect to the next page on valid form submission', async () => {
    const response = await postRequest({ formData: { latitude, longitude } })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(redirectHref)
  })

  test('should render the OSGB36 page with eastings and northings pre-populated', async () => {
    setupOsgb36()
    const { result, statusCode } = await getRequest()

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', {
        name: /Enter the coordinates at the centre point of the site/
      })
    ).toBeInTheDocument()

    expect(document.querySelector('#eastings').value).toBe(eastings)
    expect(document.querySelector('#northings').value).toBe(northings)

    expect(
      getByText(document, 'Help with eastings and northings formats')
    ).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      backHref
    )
  })
}
