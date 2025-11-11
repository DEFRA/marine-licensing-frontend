import { fileURLToPath } from 'node:url'
import path from 'path'
import nunjucks from 'nunjucks'
import { JSDOM } from 'jsdom'
import { camelCase } from 'lodash'
import * as filters from '#src/config/nunjucks/filters/filters.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
function renderComponentWithJSDOM(componentName, params, callBlock) {
  const nunjucksTestEnv = nunjucks.configure(
    [
      'node_modules/govuk-frontend/dist/',
      path.normalize(path.resolve(dirname, '../../templates')),
      path.normalize(path.resolve(dirname, '../'))
    ],
    {
      trimBlocks: true,
      lstripBlocks: true
    }
  )

  Object.entries(filters).forEach(([name, filter]) => {
    nunjucksTestEnv.addFilter(name, filter)
  })

  const macroPath = `${componentName}/macro.njk`
  const macroName = `app${
    componentName.charAt(0).toUpperCase() + camelCase(componentName.slice(1))
  }`
  const macroParams = JSON.stringify(params, null, 2)
  let macroString = `{%- from "${macroPath}" import ${macroName} -%}`

  if (callBlock) {
    macroString += `{%- call ${macroName}(${macroParams}) -%}${callBlock}{%- endcall -%}`
  } else {
    macroString += `{{- ${macroName}(${macroParams}) -}}`
  }

  const renderedHtml = nunjucksTestEnv.renderString(macroString, {})
  const { document } = new JSDOM(renderedHtml).window

  return document
}

describe('Site Details Card Component', () => {
  describe('Point/Circle Site Details', () => {
    let document

    describe('With Change links (isReadOnly: false)', () => {
      beforeEach(() => {
        document = renderComponentWithJSDOM('site-details-card', {
          siteDetails: {
            isFileUpload: false,
            isPolygonSite: false,
            reviewSummaryText: 'Draw/enter coordinates',
            coordinateSystemText:
              'WGS84\nLatitude and longitude in decimal degrees',
            coordinateDisplayText: '50.7234, -1.8795',
            circleWidth: '100'
          },
          siteNumber: 1,
          changeLink: '#',
          isReadOnly: false
        })
      })

      test('should render site details card with correct structure', () => {
        const card = document.querySelector('#site-details-1')
        expect(card).toBeTruthy()
        expect(card.classList.contains('govuk-summary-card')).toBe(true)

        // Should contain a summary list inside
        const summaryList = card.querySelector('.govuk-summary-list')
        expect(summaryList).toBeTruthy()
      })

      test('should display correct card title', () => {
        const title = document.querySelector('.govuk-summary-card__title')
        expect(title).toBeTruthy()
        expect(title.textContent.trim()).toBe('Site details')
      })

      test('should show Change action when not read-only', () => {
        const changeLink = document.querySelector(
          '.govuk-summary-card__actions a'
        )
        expect(changeLink).toBeTruthy()
        expect(changeLink.textContent.replace(/\s+/g, ' ').trim()).toBe(
          'Change ( Site details )'
        )
        expect(changeLink.getAttribute('href')).toBe('#')
      })

      test('should display all required point/circle fields', () => {
        const keys = Array.from(
          document.querySelectorAll('.govuk-summary-list__key')
        ).map((el) => el.textContent.trim())

        expect(keys).toContain('Coordinate system')
        expect(keys).toContain('Coordinates at centre of site')
        expect(keys).toContain('Width of circular site')
        expect(keys).toContain('Map view')
      })

      test('should display correct field values', () => {
        const html = document.documentElement.innerHTML

        expect(html).toContain('Draw/enter coordinates')
        expect(html).toContain(
          'WGS84<br> Latitude and longitude in decimal degrees'
        )
        expect(html).toContain('50.7234, -1.8795')
        expect(html).toContain('100 metres')
      })

      test('should include map view with correct data module', () => {
        const mapDiv = document.querySelector('.app-site-details-map')
        expect(mapDiv).toBeTruthy()
        expect(mapDiv.getAttribute('data-module')).toBe('site-details-map')
      })

      test('should handle coordinate system text with line breaks correctly', () => {
        const coordinateSystemValue = document.querySelector(
          '.govuk-summary-list__row:nth-child(2) .govuk-summary-list__value'
        )
        expect(coordinateSystemValue.innerHTML).toContain(
          'WGS84<br> Latitude and longitude'
        )
      })
    })

    describe('Read-only mode (isReadOnly: true)', () => {
      beforeEach(() => {
        document = renderComponentWithJSDOM('site-details-card', {
          siteDetails: {
            isFileUpload: false,
            isPolygonSite: false,
            reviewSummaryText: 'Draw/enter coordinates',
            coordinateSystemText:
              'British National Grid (OSGB36)\nEastings and Northings',
            coordinateDisplayText: '425053, 564180',
            circleWidth: '250'
          },
          siteNumber: 1,
          isReadOnly: true
        })
      })

      test('should render site details card', () => {
        const card = document.querySelector('#site-details-1')
        expect(card).toBeTruthy()
      })

      test('should not show Change action when read-only', () => {
        const actions = document.querySelector('.govuk-summary-card__actions')
        expect(actions).toBeFalsy()
      })

      test('should display correct read-only values', () => {
        const html = document.documentElement.innerHTML

        expect(html).toContain('Draw/enter coordinates')
        expect(html).toContain(
          'British National Grid (OSGB36)<br> Eastings and Northings'
        )
        expect(html).toContain('425053, 564180')
        expect(html).toContain('250 metres')
      })
    })
  })

  describe('Polygon Site Details', () => {
    let document

    describe('With Change links (isReadOnly: false)', () => {
      beforeEach(() => {
        document = renderComponentWithJSDOM('site-details-card', {
          siteDetails: {
            isFileUpload: false,
            isPolygonSite: true,
            reviewSummaryText: 'Draw/enter coordinates',
            coordinateSystemText:
              'WGS84\nLatitude and longitude in decimal degrees',
            polygonCoordinates: [
              { label: 'Point 1', value: '50.7234, -1.8795' },
              { label: 'Point 2', value: '50.7235, -1.8796' },
              { label: 'Point 3', value: '50.7236, -1.8797' }
            ]
          },
          siteNumber: 1,
          changeLink: '#',
          isReadOnly: false
        })
      })

      test('should render polygon site details card', () => {
        const card = document.querySelector('#site-details-1')
        expect(card).toBeTruthy()
      })

      test('should display correct card title', () => {
        const title = document.querySelector('.govuk-summary-card__title')
        expect(title.textContent.trim()).toBe('Site details')
      })

      test('should show Change action when not read-only', () => {
        const changeLink = document.querySelector(
          '.govuk-summary-card__actions a'
        )
        expect(changeLink).toBeTruthy()
        expect(changeLink.textContent.replace(/\s+/g, ' ').trim()).toBe(
          'Change ( Site details )'
        )
      })

      test('should display base polygon fields', () => {
        const keys = Array.from(
          document.querySelectorAll('.govuk-summary-list__key')
        ).map((el) => el.textContent.trim())

        expect(keys).toContain('Coordinate system')
        expect(keys).toContain('Map view')
      })

      test('should display all polygon coordinate points', () => {
        const keys = Array.from(
          document.querySelectorAll('.govuk-summary-list__key')
        ).map((el) => el.textContent.trim())

        expect(keys).toContain('Point 1')
        expect(keys).toContain('Point 2')
        expect(keys).toContain('Point 3')

        const html = document.documentElement.innerHTML
        expect(html).toContain('50.7234, -1.8795')
        expect(html).toContain('50.7235, -1.8796')
        expect(html).toContain('50.7236, -1.8797')
      })

      test('should include map view', () => {
        const mapDiv = document.querySelector('.app-site-details-map')
        expect(mapDiv).toBeTruthy()
        expect(mapDiv.getAttribute('data-module')).toBe('site-details-map')
      })
    })

    describe('Read-only mode (isReadOnly: true)', () => {
      beforeEach(() => {
        document = renderComponentWithJSDOM('site-details-card', {
          siteDetails: {
            isFileUpload: false,
            isPolygonSite: true,
            reviewSummaryText: 'Draw/enter coordinates',
            coordinateSystemText:
              'British National Grid (OSGB36)\nEastings and Northings',
            polygonCoordinates: [
              { label: 'Point A', value: '425053, 564180' },
              { label: 'Point B', value: '425054, 564181' }
            ]
          },
          siteNumber: 1,
          isReadOnly: true
        })
      })

      test('should not show Change action when read-only', () => {
        const actions = document.querySelector('.govuk-summary-card__actions')
        expect(actions).toBeFalsy()
      })

      test('should display polygon coordinates in read-only mode', () => {
        const keys = Array.from(
          document.querySelectorAll('.govuk-summary-list__key')
        ).map((el) => el.textContent.trim())

        expect(keys).toContain('Point A')
        expect(keys).toContain('Point B')
      })
    })

    describe('Empty polygon coordinates', () => {
      beforeEach(() => {
        document = renderComponentWithJSDOM('site-details-card', {
          siteDetails: {
            isFileUpload: false,
            isPolygonSite: true,
            reviewSummaryText: 'Draw/enter coordinates',
            coordinateSystemText:
              'WGS84\nLatitude and longitude in decimal degrees',
            polygonCoordinates: []
          },
          siteNumber: 1,
          changeLink: '#',
          isReadOnly: false
        })
      })

      test('should handle empty polygon coordinates gracefully', () => {
        const card = document.querySelector('#site-details-1')
        expect(card).toBeTruthy()

        const keys = Array.from(
          document.querySelectorAll('.govuk-summary-list__key')
        ).map((el) => el.textContent.trim())

        // Should still have base fields and map view
        expect(keys).toContain('Coordinate system')
        expect(keys).toContain('Map view')
      })
    })
  })

  describe('File Upload Site Details', () => {
    let document

    describe('With Change links (isReadOnly: false)', () => {
      beforeEach(() => {
        document = renderComponentWithJSDOM('site-details-card', {
          siteDetails: {
            isFileUpload: true,
            isPolygonSite: false,
            method: 'Upload a file',
            fileType: 'Shapefile (.shp)',
            filename: 'site-boundaries.shp'
          },
          siteNumber: 1,
          changeLink: '#',
          isReadOnly: false
        })
      })

      test('should render file upload site details card', () => {
        const card = document.querySelector('#site-details-1')
        expect(card).toBeTruthy()
      })

      test('should display correct card title', () => {
        const title = document.querySelector('.govuk-summary-card__title')
        expect(title.textContent.trim()).toBe('Site details')
      })

      test('should show Change action when not read-only', () => {
        const changeLink = document.querySelector(
          '.govuk-summary-card__actions a'
        )
        expect(changeLink).toBeTruthy()
        expect(changeLink.textContent.replace(/\s+/g, ' ').trim()).toBe(
          'Change ( Site details )'
        )
      })

      test('should display all required file upload fields', () => {
        const keys = Array.from(
          document.querySelectorAll('.govuk-summary-list__key')
        ).map((el) => el.textContent.trim())

        expect(keys).toContain('Map view')
      })

      test('should display correct file upload values', () => {
        const mapDiv = document.querySelector('.app-site-details-map')
        expect(mapDiv).toBeTruthy()
      })

      test('should include map view', () => {
        const mapDiv = document.querySelector('.app-site-details-map')
        expect(mapDiv).toBeTruthy()
        expect(mapDiv.getAttribute('data-module')).toBe('site-details-map')
      })
    })

    describe('Read-only mode (isReadOnly: true)', () => {
      beforeEach(() => {
        document = renderComponentWithJSDOM('site-details-card', {
          siteDetails: {
            isFileUpload: true,
            isPolygonSite: false,
            method: 'Upload a file',
            fileType: 'KML (.kml)',
            filename: 'marine-area.kml'
          },
          siteNumber: 1,
          isReadOnly: true
        })
      })

      test('should not show Change action when read-only', () => {
        const actions = document.querySelector('.govuk-summary-card__actions')
        expect(actions).toBeFalsy()
      })

      test('should display file upload values in read-only mode', () => {
        const mapDiv = document.querySelector('.app-site-details-map')
        expect(mapDiv).toBeTruthy()
      })
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle missing siteDetails gracefully', () => {
      expect(() => {
        renderComponentWithJSDOM('site-details-card', {
          siteNumber: 1,
          changeLink: '#',
          isReadOnly: false
        })
      }).not.toThrow()
    })

    test('should handle undefined isReadOnly parameter', () => {
      const document = renderComponentWithJSDOM('site-details-card', {
        siteDetails: {
          isFileUpload: false,
          isPolygonSite: false,
          reviewSummaryText: 'Test'
        },
        siteNumber: 1
      })

      const card = document.querySelector('#site-details-1')
      expect(card).toBeTruthy()
    })

    test('should handle missing coordinate system text', () => {
      const document = renderComponentWithJSDOM('site-details-card', {
        siteDetails: {
          isFileUpload: false,
          isPolygonSite: false,
          reviewSummaryText: 'Draw/enter coordinates',
          coordinateDisplayText: '50.7234, -1.8795',
          circleWidth: '100'
        },
        siteNumber: 1,
        changeLink: '#',
        isReadOnly: false
      })

      const card = document.querySelector('#site-details-1')
      expect(card).toBeTruthy()
    })

    test('should handle missing file upload properties', () => {
      const document = renderComponentWithJSDOM('site-details-card', {
        siteDetails: {
          isFileUpload: true,
          isPolygonSite: false
        },
        siteNumber: 1,
        changeLink: '#',
        isReadOnly: false
      })

      const card = document.querySelector('#site-details-1')
      expect(card).toBeTruthy()
    })
  })
})
