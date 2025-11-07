import { buildSiteLocationData } from './site-location-data.js'

describe('buildSiteLocationData', () => {
  test('Should return null when siteDetails is empty', () => {
    const result = buildSiteLocationData({}, [])
    expect(result).toBeNull()
  })

  test('Should return null when siteDetails is undefined', () => {
    const result = buildSiteLocationData({}, undefined)
    expect(result).toBeNull()
  })

  test('Should build data for manual coordinate entry (single site)', () => {
    const multipleSiteDetails = {
      multipleSitesEnabled: false,
      sameActivityDates: 'no',
      sameActivityDescription: 'no'
    }

    const siteDetails = [
      {
        coordinatesType: 'coordinates',
        coordinatesEntry: 'single'
      }
    ]

    const result = buildSiteLocationData(multipleSiteDetails, siteDetails)

    expect(result).toEqual({
      multipleSiteDetails: 'No',
      sameActivityDates: 'No',
      sameActivityDescription: 'No',
      multipleSitesEnabled: false,
      method: 'Enter the coordinates of the site manually',
      isFileUpload: false
    })
  })

  test('Should build data for manual coordinate entry (multiple sites)', () => {
    const multipleSiteDetails = {
      multipleSitesEnabled: true,
      sameActivityDates: 'yes',
      sameActivityDescription: 'yes'
    }

    const siteDetails = [
      {
        coordinatesType: 'coordinates',
        coordinatesEntry: 'multiple',
        activityDates: {
          start: '2025-01-01T00:00:00.000Z',
          end: '2025-01-31T00:00:00.000Z'
        },
        activityDescription: 'Test activity'
      }
    ]

    const result = buildSiteLocationData(multipleSiteDetails, siteDetails)

    expect(result).toEqual({
      multipleSiteDetails: 'Yes',
      sameActivityDates: 'Yes',
      sameActivityDescription: 'Yes',
      multipleSitesEnabled: true,
      method: 'Enter the coordinates of the site manually',
      isFileUpload: false,
      activityDates: '1 January 2025 to 31 January 2025',
      activityDescription: 'Test activity'
    })
  })

  test('Should build data for file upload with KML', () => {
    const multipleSiteDetails = {
      multipleSitesEnabled: false,
      sameActivityDates: 'no',
      sameActivityDescription: 'no'
    }

    const siteDetails = [
      {
        coordinatesType: 'file',
        fileUploadType: 'kml',
        uploadedFile: {
          filename: 'test-site.kml'
        }
      }
    ]

    const result = buildSiteLocationData(multipleSiteDetails, siteDetails)

    expect(result).toEqual({
      multipleSiteDetails: 'No',
      sameActivityDates: 'No',
      sameActivityDescription: 'No',
      multipleSitesEnabled: false,
      method: 'Upload a file with the coordinates of the site',
      isFileUpload: true,
      fileType: 'KML',
      filename: 'test-site.kml'
    })
  })

  test('Should build data for file upload with Shapefile', () => {
    const multipleSiteDetails = {
      multipleSitesEnabled: true,
      sameActivityDates: 'yes',
      sameActivityDescription: 'no'
    }

    const siteDetails = [
      {
        coordinatesType: 'file',
        fileUploadType: 'shapefile',
        uploadedFile: {
          filename: 'site-boundary.zip'
        },
        activityDates: {
          start: '2025-02-01T00:00:00.000Z',
          end: '2025-02-28T00:00:00.000Z'
        }
      }
    ]

    const result = buildSiteLocationData(multipleSiteDetails, siteDetails)

    expect(result).toEqual({
      multipleSiteDetails: 'Yes',
      sameActivityDates: 'Yes',
      sameActivityDescription: 'No',
      multipleSitesEnabled: true,
      method: 'Upload a file with the coordinates of the site',
      isFileUpload: true,
      fileType: 'Shapefile',
      filename: 'site-boundary.zip',
      activityDates: '1 February 2025 to 28 February 2025'
    })
  })

  test('Should handle missing multipleSiteDetails', () => {
    const siteDetails = [
      {
        coordinatesType: 'coordinates'
      }
    ]

    const result = buildSiteLocationData(undefined, siteDetails)

    expect(result).toEqual({
      multipleSiteDetails: 'No',
      sameActivityDates: 'No',
      sameActivityDescription: 'No',
      multipleSitesEnabled: undefined,
      method: 'Enter the coordinates of the site manually',
      isFileUpload: false
    })
  })

  test('Should include activityDescription only when sameActivityDescription is yes', () => {
    const multipleSiteDetails = {
      multipleSitesEnabled: true,
      sameActivityDates: 'no',
      sameActivityDescription: 'yes'
    }

    const siteDetails = [
      {
        coordinatesType: 'coordinates',
        activityDescription: 'Shared description for all sites'
      }
    ]

    const result = buildSiteLocationData(multipleSiteDetails, siteDetails)

    expect(result.activityDescription).toBe('Shared description for all sites')
    expect(result.activityDates).toBeUndefined()
  })

  test('Should include activityDates only when sameActivityDates is yes', () => {
    const multipleSiteDetails = {
      multipleSitesEnabled: true,
      sameActivityDates: 'yes',
      sameActivityDescription: 'no'
    }

    const siteDetails = [
      {
        coordinatesType: 'file',
        fileUploadType: 'kml',
        uploadedFile: { filename: 'test.kml' },
        activityDates: {
          start: '2025-03-15T00:00:00.000Z',
          end: '2025-03-20T00:00:00.000Z'
        }
      }
    ]

    const result = buildSiteLocationData(multipleSiteDetails, siteDetails)

    expect(result.activityDates).toBe('15 March 2025 to 20 March 2025')
    expect(result.activityDescription).toBeUndefined()
  })
})
