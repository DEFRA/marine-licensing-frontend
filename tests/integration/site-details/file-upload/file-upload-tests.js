import { getByRole, getByText } from '@testing-library/dom'
import { getSingleSiteMode } from '~/src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  routes,
  marineLicenceRoutes
} from '~/src/server/common/constants/routes.js'

export function sharedFileUploadTests({ loadPageWithFileType, projectType }) {
  test('should show shapefile heading and guidance text', async () => {
    const document = await loadPageWithFileType('shapefile')

    const h1 = getByRole(document, 'heading', { level: 1 })
    expect(h1).toHaveTextContent('Upload a shapefile')

    const zipFileText = getByText(
      document,
      /Upload a ZIP file containing all the files for your shapefile/i
    )
    expect(zipFileText).toBeInTheDocument()

    expect(
      getByText(document, /You can include more than one site/i)
    ).toBeInTheDocument()

    const { Node } = document.defaultView
    expect(
      h1.compareDocumentPosition(zipFileText) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  test('should show KML heading and polygon guidance text only', async () => {
    const document = await loadPageWithFileType('kml')

    const h1 = getByRole(document, 'heading', { level: 1 })
    expect(h1).toHaveTextContent('Upload a KML file')

    expect(
      document.body.textContent.includes(
        'Upload a ZIP file containing all the files for your shapefile'
      )
    ).toBe(false)

    expect(
      document.body.textContent.includes('You can include more than one site')
    ).toBe(true)

    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      projectType === 'exemption'
        ? `${routes.TASK_LIST}?cancel=site-details`
        : `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
    )
  })
}

export function singleSiteModeTests({ loadPageWithFileType }) {
  test('should show shapefile heading and guidance text', async () => {
    vi.mocked(getSingleSiteMode).mockReturnValue(true)

    const document = await loadPageWithFileType('shapefile')

    const h1 = getByRole(document, 'heading', { level: 1 })
    expect(h1).toHaveTextContent('Upload a shapefile')

    const zipFileText = getByText(
      document,
      /Upload a ZIP file containing all the files for your shapefile/i
    )
    expect(zipFileText).toBeInTheDocument()

    const { Node } = document.defaultView
    expect(
      h1.compareDocumentPosition(zipFileText) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()

    expect(
      document.body.textContent.includes(
        'The file you upload must be for a single site.'
      )
    ).toBe(true)
  })

  test('should show KML heading and polygon guidance text only', async () => {
    vi.mocked(getSingleSiteMode).mockReturnValue(true)

    const document = await loadPageWithFileType('kml')

    const h1 = getByRole(document, 'heading', { level: 1 })
    expect(h1).toHaveTextContent('Upload a KML file')

    expect(
      document.body.textContent.includes(
        'Upload a ZIP file containing all the files for your shapefile'
      )
    ).toBe(false)

    expect(
      document.body.textContent.includes(
        'The file you upload must be for a single site.'
      )
    ).toBe(true)

    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })
}
