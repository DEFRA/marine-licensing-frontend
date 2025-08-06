const baseExemption = {
  id: 'test-exemption-123',
  projectName: 'Hammersmith pontoon construction',
  activityDates: {
    start: '2025-07-01',
    end: '2025-07-07'
  },
  activityDescription:
    'We will be installing a pontoon approximately 20 metres squared at the east of our garden that backs onto the river.',
  siteDetails: {
    coordinatesType: 'file',
    geoJSON: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-1.2345, 50.9876],
                [-1.2335, 50.9876],
                [-1.2335, 50.9886],
                [-1.2345, 50.9886],
                [-1.2345, 50.9876]
              ]
            ]
          }
        }
      ]
    }
  },
  publicRegister: {
    withholdFromPublicRegister: false
  },
  taskList: {
    projectName: { status: 'completed' },
    activityDates: { status: 'completed' },
    activityDescription: { status: 'completed' },
    siteDetails: { status: 'completed' },
    publicRegister: { status: 'completed' }
  }
}

export const testScenarios = [
  {
    name: 'Shapefile upload (default fixture)',
    exemption: {
      ...baseExemption,
      siteDetails: {
        ...baseExemption.siteDetails,
        fileUploadType: 'shapefile',
        uploadedFile: { filename: 'Cavendish_Dock_Boundary_Polygon_WGS84.zip' }
      }
    },
    expected: {
      fileType: 'Shapefile',
      filename: 'Cavendish_Dock_Boundary_Polygon_WGS84.zip'
    }
  },
  {
    name: 'KML upload',
    exemption: {
      ...baseExemption,
      siteDetails: {
        ...baseExemption.siteDetails,
        fileUploadType: 'kml',
        uploadedFile: { filename: 'coordinates.kml' }
      }
    },
    expected: {
      fileType: 'KML',
      filename: 'coordinates.kml'
    }
  },
  {
    name: 'user story example Shapefile (Hammersmith_coordinates.zip)',
    exemption: {
      ...baseExemption,
      siteDetails: {
        ...baseExemption.siteDetails,
        fileUploadType: 'shapefile',
        uploadedFile: { filename: 'Hammersmith_coordinates.zip' }
      }
    },
    expected: {
      fileType: 'Shapefile',
      filename: 'Hammersmith_coordinates.zip'
    }
  }
]

export const errorScenarios = [
  {
    name: 'missing filename gracefully',
    exemption: {
      ...baseExemption,
      siteDetails: {
        ...baseExemption.siteDetails,
        fileUploadType: 'shapefile',
        uploadedFile: { filename: undefined }
      }
    },
    expected: {
      fileType: 'Shapefile',
      filename: null
    }
  }
]
