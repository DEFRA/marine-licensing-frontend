export const baseExemption = {
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
    fileUploadType: 'shapefile',
    uploadedFile: {
      filename: 'Cavendish_Dock_Boundary_Polygon_WGS84.zip'
    },
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
