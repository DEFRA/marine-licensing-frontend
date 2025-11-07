import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Site Location Card Component', () => {
  let $component

  describe('File upload variant', () => {
    describe('With Change links (isReadOnly: false)', () => {
      beforeEach(() => {
        $component = renderComponent('site-location-card', {
          siteLocationData: {
            isFileUpload: true,
            method: 'Upload a file with the coordinates of the site',
            fileType: 'KML',
            filename: 'test-site.kml',
            multipleSiteDetails: 'No',
            multipleSitesEnabled: false
          },
          isReadOnly: false
        })
      })

      test('Should render site location card component', () => {
        expect($component('#site-location-card')).toHaveLength(1)
      })

      test('Should have correct card title', () => {
        expect($component('.govuk-summary-card__title').text().trim()).toBe(
          'Providing the site location'
        )
      })

      test('Should display method of providing site location', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('Method of providing site location')
        expect(htmlContent).toContain(
          'Upload a file with the coordinates of the site'
        )
      })

      test('Should display file type', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('File type')
        expect(htmlContent).toContain('KML')
      })

      test('Should display file uploaded', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('File uploaded')
        expect(htmlContent).toContain('test-site.kml')
      })

      test('Should show Change link when not read-only', () => {
        expect(
          $component('.govuk-summary-card__actions a').text().trim()
        ).toContain('Change')
      })
    })

    describe('Read-only mode (isReadOnly: true)', () => {
      beforeEach(() => {
        $component = renderComponent('site-location-card', {
          siteLocationData: {
            isFileUpload: true,
            method: 'Upload a file with the coordinates of the site',
            fileType: 'Shapefile',
            filename: 'site-boundary.shp',
            multipleSiteDetails: 'Yes',
            multipleSitesEnabled: true
          },
          isReadOnly: true
        })
      })

      test('Should render site location card component', () => {
        expect($component('#site-location-card')).toHaveLength(1)
      })

      test('Should display all file upload fields', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('Method of providing site location')
        expect(htmlContent).toContain('File type')
        expect(htmlContent).toContain('Shapefile')
        expect(htmlContent).toContain('File uploaded')
        expect(htmlContent).toContain('site-boundary.shp')
      })

      test('Should not show Change link when read-only', () => {
        expect($component('.govuk-summary-card__actions')).toHaveLength(0)
      })
    })
  })

  describe('Coordinates variant (manual entry)', () => {
    describe('Single site with Change links', () => {
      beforeEach(() => {
        $component = renderComponent('site-location-card', {
          siteLocationData: {
            isFileUpload: false,
            method: 'Enter the coordinates of the site manually',
            multipleSiteDetails: 'No',
            multipleSitesEnabled: false
          },
          isReadOnly: false
        })
      })

      test('Should render site location card component', () => {
        expect($component('#site-location-card')).toHaveLength(1)
      })

      test('Should have correct card title', () => {
        expect($component('.govuk-summary-card__title').text().trim()).toBe(
          'Providing the site location'
        )
      })

      test('Should display method of providing site location', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('Method of providing site location')
        expect(htmlContent).toContain(
          'Enter the coordinates of the site manually'
        )
      })

      test('Should display "More than one site" as No for single site', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('More than one site')
        expect(htmlContent).toContain('No')
      })

      test('Should show Change link when not read-only', () => {
        expect(
          $component('.govuk-summary-card__actions a').text().trim()
        ).toContain('Change')
      })
    })

    describe('Multiple sites enabled', () => {
      beforeEach(() => {
        $component = renderComponent('site-location-card', {
          siteLocationData: {
            isFileUpload: false,
            method: 'Enter the coordinates of the site manually',
            multipleSiteDetails: 'Yes',
            multipleSitesEnabled: true
          },
          isReadOnly: false
        })
      })

      test('Should display "More than one site" as Yes for multiple sites', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('More than one site')
        expect(htmlContent).toContain('Yes')
      })
    })

    describe('Read-only mode', () => {
      beforeEach(() => {
        $component = renderComponent('site-location-card', {
          siteLocationData: {
            isFileUpload: false,
            method: 'Enter the coordinates of the site manually',
            multipleSiteDetails: 'No',
            multipleSitesEnabled: false
          },
          isReadOnly: true
        })
      })

      test('Should display all coordinate entry fields', () => {
        const htmlContent = $component.html()
        expect(htmlContent).toContain('Method of providing site location')
        expect(htmlContent).toContain('More than one site')
        expect(htmlContent).toContain('No')
      })

      test('Should not show Change link when read-only', () => {
        expect($component('.govuk-summary-card__actions')).toHaveLength(0)
      })
    })
  })
})
