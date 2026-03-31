import { getByRole, getByText } from '@testing-library/dom'

/**
 * @param {{ loadPageWithFileType: (fileUploadType: string) => Promise<Document> }} options
 */
export function sharedFileUploadTests({ loadPageWithFileType }) {
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

  test('should show KML heading and not show shapefile guidance text', async () => {
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
    ).toBe(false)
  })
}
