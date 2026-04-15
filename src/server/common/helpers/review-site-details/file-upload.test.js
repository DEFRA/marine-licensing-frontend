import { getFileUploadSummaryData } from '#src/server/common/helpers/review-site-details/file-upload.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('getFileUploadSummaryData util', () => {
  const activityDetails =
    mockMarineLicenceApplication.siteDetails[0].activityDetails

  test('getFileUploadSummaryData correctly parses coordinates from geoJSON for KML', () => {
    const project = {
      siteDetails: {
        activityDetails,
        fileUploadType: 'kml',
        uploadedFile: {
          filename: 'test-site.kml'
        },
        geoJSON: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [51.5074, -0.1278]
              }
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0]
                  ]
                ]
              }
            }
          ]
        }
      }
    }

    const result = getFileUploadSummaryData(project)

    expect(result).toEqual({
      activityDetails,
      coordinates: [
        {
          type: 'Point',
          coordinates: [51.5074, -0.1278]
        },
        {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0]
            ]
          ]
        }
      ],
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [51.5074, -0.1278]
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [0, 0],
                  [1, 0],
                  [1, 1],
                  [0, 1],
                  [0, 0]
                ]
              ]
            }
          }
        ]
      }
    })
  })

  test('getFileUploadSummaryData correctly parses coordinates from geoJSON for Shapefile', () => {
    const project = {
      siteDetails: {
        activityDetails,
        fileUploadType: 'shapefile',
        uploadedFile: {
          filename: 'test-site.shp'
        },
        geoJSON: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [0, 0],
                  [1, 1],
                  [2, 2]
                ]
              }
            }
          ]
        }
      }
    }

    const result = getFileUploadSummaryData(project)

    expect(result).toEqual({
      activityDetails,
      coordinates: [
        {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [1, 1],
            [2, 2]
          ]
        }
      ],
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [0, 0],
                [1, 1],
                [2, 2]
              ]
            }
          }
        ]
      }
    })
  })

  test('getFileUploadSummaryData handles empty or missing geoJSON', () => {
    const project = {
      siteDetails: {
        fileUploadType: 'kml',
        uploadedFile: {
          filename: 'test-site.kml'
        },
        geoJSON: {}
      }
    }

    const result = getFileUploadSummaryData(project)

    expect(result).toEqual({
      coordinates: [],
      geoJSON: {},
      activityDetails: []
    })
  })

  test('getFileUploadSummaryData handles missing site details', () => {
    const project = {}

    const result = getFileUploadSummaryData(project)

    expect(result).toEqual({
      coordinates: [],
      geoJSON: {},
      activityDetails: []
    })
  })

  test('getFileUploadSummaryData handles invalid file type', () => {
    const project = {
      siteDetails: [
        {
          fileUploadType: 'invalid',
          uploadedFile: {
            filename: 'test-site.xyz'
          },
          geoJSON: {
            type: 'FeatureCollection',
            features: []
          }
        }
      ]
    }

    const result = getFileUploadSummaryData(project)

    expect(result).toEqual({
      coordinates: [],
      geoJSON: {},
      activityDetails: []
    })
  })
})
