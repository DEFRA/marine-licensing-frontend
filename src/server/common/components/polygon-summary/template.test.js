import { renderComponent } from '~/src/server/test-helpers/component-helpers.js'

describe('Polygon Summary Component', () => {
  /** @type {CheerioAPI} */
  let $component

  describe('With Change links (isReadOnly: false)', () => {
    beforeEach(() => {
      $component = renderComponent('polygon-summary', {
        siteDetails: {
          reviewSummaryText: 'Draw/enter coordinates',
          coordinateSystemText:
            'WGS84\nLatitude and longitude in decimal degrees',
          polygonCoordinates: [
            { label: 'Coordinate 1', value: '50.7234, -1.8795' },
            { label: 'Coordinate 2', value: '50.7244, -1.8785' },
            { label: 'Coordinate 3', value: '50.7254, -1.8775' }
          ]
        },
        isReadOnly: false
      })
    })

    test('Should render polygon summary component', () => {
      expect($component('#site-details-card')).toHaveLength(1)
    })

    test('Should display static site details information', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Draw/enter coordinates')
      expect(htmlContent).toContain('WGS84<br> Latitude and longitude')
    })

    test('Should display all polygon coordinates', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Coordinate 1')
      expect(htmlContent).toContain('50.7234, -1.8795')
      expect(htmlContent).toContain('Coordinate 2')
      expect(htmlContent).toContain('50.7244, -1.8785')
      expect(htmlContent).toContain('Coordinate 3')
      expect(htmlContent).toContain('50.7254, -1.8775')
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

    test('Should display all required static fields', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Method of providing site location')
      expect(htmlContent).toContain('Coordinate system')
    })

    test('Should handle coordinate system text with line breaks', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('WGS84<br> Latitude and longitude')
    })
  })

  describe('Read-only mode (isReadOnly: true)', () => {
    beforeEach(() => {
      $component = renderComponent('polygon-summary', {
        siteDetails: {
          reviewSummaryText: 'Draw/enter coordinates',
          coordinateSystemText: 'OSGB36\nBritish National Grid',
          polygonCoordinates: [
            { label: 'Coordinate A', value: '425053, 564180' },
            { label: 'Coordinate B', value: '426000, 565000' },
            { label: 'Coordinate C', value: '427000, 566000' },
            { label: 'Coordinate D', value: '428000, 567000' }
          ]
        },
        isReadOnly: true
      })
    })

    test('Should render polygon summary component', () => {
      expect($component('#site-details-card')).toHaveLength(1)
    })

    test('Should display static site details information', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Draw/enter coordinates')
      expect(htmlContent).toContain('OSGB36<br> British National Grid')
    })

    test('Should display all polygon coordinates', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Coordinate A')
      expect(htmlContent).toContain('425053, 564180')
      expect(htmlContent).toContain('Coordinate B')
      expect(htmlContent).toContain('426000, 565000')
      expect(htmlContent).toContain('Coordinate C')
      expect(htmlContent).toContain('427000, 566000')
      expect(htmlContent).toContain('Coordinate D')
      expect(htmlContent).toContain('428000, 567000')
    })

    test('Should not show Change link when read-only', () => {
      expect($component('.govuk-summary-card__actions')).toHaveLength(0)
    })

    test('Should have correct card title', () => {
      expect($component('.govuk-summary-card__title').text().trim()).toBe(
        'Site details'
      )
    })

    test('Should display all required static fields', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('Method of providing site location')
      expect(htmlContent).toContain('Coordinate system')
    })

    test('Should handle OSGB36 coordinate system with line breaks', () => {
      const htmlContent = $component.html()
      expect(htmlContent).toContain('OSGB36<br> British National Grid')
    })
  })

  describe('Edge cases', () => {
    test('Should handle polygon with minimum 3 coordinates', () => {
      $component = renderComponent('polygon-summary', {
        siteDetails: {
          reviewSummaryText: 'Draw/enter coordinates',
          coordinateSystemText:
            'WGS84\nLatitude and longitude in decimal degrees',
          polygonCoordinates: [
            { label: 'Point 1', value: '50.7234, -1.8795' },
            { label: 'Point 2', value: '50.7244, -1.8785' },
            { label: 'Point 3', value: '50.7254, -1.8775' }
          ]
        },
        isReadOnly: false
      })

      const htmlContent = $component.html()
      expect(htmlContent).toContain('Point 1')
      expect(htmlContent).toContain('Point 2')
      expect(htmlContent).toContain('Point 3')
      expect(htmlContent).toContain('50.7234, -1.8795')
      expect(htmlContent).toContain('50.7244, -1.8785')
      expect(htmlContent).toContain('50.7254, -1.8775')
    })

    test('Should handle polygon with many coordinates', () => {
      const manyCoordinates = []
      for (let i = 1; i <= 10; i++) {
        const baseEasting = 425053 + i * 1000
        const baseNorthing = 564180 + i * 1000
        manyCoordinates.push({
          label: `Point ${i}`,
          value: `${baseEasting}, ${baseNorthing}`
        })
      }

      $component = renderComponent('polygon-summary', {
        siteDetails: {
          reviewSummaryText: 'Draw/enter coordinates',
          coordinateSystemText:
            'WGS84\nLatitude and longitude in decimal degrees',
          polygonCoordinates: manyCoordinates
        },
        isReadOnly: true
      })

      const htmlContent = $component.html()
      expect(htmlContent).toContain('Point 1')
      expect(htmlContent).toContain('Point 10')
      expect(htmlContent).toContain('426053, 565180')
      expect(htmlContent).toContain('435053, 574180')
    })

    test('Should handle empty polygon coordinates array', () => {
      $component = renderComponent('polygon-summary', {
        siteDetails: {
          reviewSummaryText: 'Draw/enter coordinates',
          coordinateSystemText:
            'WGS84\nLatitude and longitude in decimal degrees',
          polygonCoordinates: []
        },
        isReadOnly: false
      })

      const htmlContent = $component.html()
      expect(htmlContent).toContain('Draw/enter coordinates')
      expect(htmlContent).toContain('WGS84<br> Latitude and longitude')
      // Should still render the static fields even with no coordinates
      expect($component('#site-details-card')).toHaveLength(1)
    })
  })
})
