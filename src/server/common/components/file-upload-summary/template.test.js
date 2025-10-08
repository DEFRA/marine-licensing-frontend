import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('File Upload Summary Component', () => {
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    beforeEach(() => {
      $component = renderComponent('file-upload-summary', {
        siteDetails: {
          method: 'Upload a file',
          fileType: 'KML',
          filename: 'marine-site-boundaries.kml'
        },
        isReadOnly: false
      })
    })

    test('Should render file upload summary component', () => {
      expect($component('#site-details-card')).toHaveLength(1)
    })

    test('Should display site details information', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Upload a file')
      expect(htmlContent).toContain('KML')
      expect(htmlContent).toContain('marine-site-boundaries.kml')
    })

    test('Should show Change link when not read-only', () => {
      expect(
        $component('.govuk-summary-card__actions a').text().trim()
      ).toContain('Change')
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Site details'
      )
    })

    test('Should display all required fields', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Method of providing site location')
      expect(htmlContent).toContain('File type')
      expect(htmlContent).toContain('File uploaded')
    })
  })

  describe('Read-only mode (isReadOnly: true)', () => {
    beforeEach(() => {
      $component = renderComponent('file-upload-summary', {
        siteDetails: {
          method: 'Upload a file',
          fileType: 'Shapefile',
          filename: 'coastal-zones.zip'
        },
        isReadOnly: true
      })
    })

    test('Should render file upload summary component', () => {
      expect($component('#site-details-card')).toHaveLength(1)
    })

    test('Should display site details information', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Upload a file')
      expect(htmlContent).toContain('Shapefile')
      expect(htmlContent).toContain('coastal-zones.zip')
    })

    test('Should not show Change link when read-only', () => {
      expect($component('.govuk-summary-card__actions')).toHaveLength(0)
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Site details'
      )
    })

    test('Should display all required fields', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Method of providing site location')
      expect(htmlContent).toContain('File type')
      expect(htmlContent).toContain('File uploaded')
    })
  })
})
