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
    name: 'Shapefile upload',
    exemption: {
      ...baseExemption,
      siteDetails: {
        ...baseExemption.siteDetails,
        coordinateSystem: 'wgs84',
        fileUploadType: 'shapefile',
        uploadedFile: { filename: 'Cavendish_Dock_Boundary_Polygon_WGS84.zip' }
      }
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: [
        'Project details',
        'Activity dates',
        'Activity details',
        'Site details',
        'Public register'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      activityDates: {
        'Start date': '1 July 2025',
        'End date': '7 July 2025'
      },
      activityDetails: {
        'Activity description':
          'We will be installing a pontoon approximately 20 metres squared at the east of our garden that backs onto the river.'
      },
      siteDetails: {
        'Method of providing site location':
          'Upload a file with the coordinates of the site',
        'File type': 'Shapefile',
        'File uploaded': 'Cavendish_Dock_Boundary_Polygon_WGS84.zip',
        'Map view': ''
      },
      publicRegister: {
        'Information withheld from public register': 'No'
      },
      submitButton: 'Confirm and send'
    }
  },
  {
    name: 'KML upload',
    exemption: {
      ...baseExemption,
      siteDetails: {
        ...baseExemption.siteDetails,
        coordinateSystem: 'wgs84',
        fileUploadType: 'kml',
        uploadedFile: { filename: 'coordinates.kml' }
      }
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: [
        'Project details',
        'Activity dates',
        'Activity details',
        'Site details',
        'Public register'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      activityDates: {
        'Start date': '1 July 2025',
        'End date': '7 July 2025'
      },
      activityDetails: {
        'Activity description':
          'We will be installing a pontoon approximately 20 metres squared at the east of our garden that backs onto the river.'
      },
      siteDetails: {
        'Method of providing site location':
          'Upload a file with the coordinates of the site',
        'File type': 'KML',
        'File uploaded': 'coordinates.kml',
        'Map view': ''
      },
      publicRegister: {
        'Information withheld from public register': 'No'
      },
      submitButton: 'Confirm and send'
    }
  },
  {
    name: 'Shapefile upload (OSGB36)',
    exemption: {
      ...baseExemption,
      siteDetails: {
        ...baseExemption.siteDetails,
        coordinateSystem: 'osgb36',
        fileUploadType: 'shapefile',
        uploadedFile: { filename: 'OSGB36_Site_Boundary.zip' }
      }
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: [
        'Project details',
        'Activity dates',
        'Activity details',
        'Site details',
        'Public register'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      activityDates: {
        'Start date': '1 July 2025',
        'End date': '7 July 2025'
      },
      activityDetails: {
        'Activity description':
          'We will be installing a pontoon approximately 20 metres squared at the east of our garden that backs onto the river.'
      },
      siteDetails: {
        'Method of providing site location':
          'Upload a file with the coordinates of the site',
        'File type': 'Shapefile',
        'File uploaded': 'OSGB36_Site_Boundary.zip',
        'Map view': ''
      },
      publicRegister: {
        'Information withheld from public register': 'No'
      },
      submitButton: 'Confirm and send'
    }
  }
]
