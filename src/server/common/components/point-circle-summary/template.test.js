import { renderComponent } from '#src/server/test-helpers/component-helpers.js'

describe('Point Circle Summary Component', () => {
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    beforeEach(() => {
      $component = renderComponent('point-circle-summary', {
        siteDetails: {
          reviewSummaryText: 'Draw/enter coordinates',
          coordinateSystemText:
            'WGS84\nLatitude and longitude in decimal degrees',
          coordinateDisplayText: '50.7234, -1.8795',
          circleWidth: '100'
        },
        isReadOnly: false
      })
    })

    test('Should render point circle summary component', () => {
      expect($component('#site-details-card')).toHaveLength(1)
    })

    test('Should display site details information', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Draw/enter coordinates')
      expect(htmlContent).toContain('WGS84')
      expect(htmlContent).toContain('50.7234, -1.8795')
      expect(htmlContent).toContain('100 metres')
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
      expect(htmlContent).toContain('Coordinate system')
      expect(htmlContent).toContain('Coordinates at centre of site')
      expect(htmlContent).toContain('Width of circular site')
    })

    test('Should handle coordinate system text with line breaks', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('WGS84<br> Latitude and longitude')
    })
  })

  describe('Read-only mode (isReadOnly: true)', () => {
    beforeEach(() => {
      $component = renderComponent('point-circle-summary', {
        siteDetails: {
          reviewSummaryText: 'Draw/enter coordinates',
          coordinateSystemText: 'OSGB36\nBritish National Grid',
          coordinateDisplayText: '425053, 564180',
          circleWidth: '250'
        },
        isReadOnly: true
      })
    })

    test('Should render point circle summary component', () => {
      expect($component('#site-details-card')).toHaveLength(1)
    })

    test('Should display site details information', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Draw/enter coordinates')
      expect(htmlContent).toContain('OSGB36')
      expect(htmlContent).toContain('425053, 564180')
      expect(htmlContent).toContain('250 metres')
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
      expect(htmlContent).toContain('Coordinate system')
      expect(htmlContent).toContain('Coordinates at centre of site')
      expect(htmlContent).toContain('Width of circular site')
    })

    test('Should handle OSGB36 coordinate system with line breaks', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('OSGB36<br> British National Grid')
    })
  })
})
