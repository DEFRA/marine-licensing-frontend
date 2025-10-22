const baseExemption = {
  id: 'test-exemption-123',
  projectName: 'Hammersmith pontoon construction',
  siteDetails: [
    {
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
    }
  ],
  publicRegister: {
    withholdFromPublicRegister: false
  },
  taskList: {
    projectName: { status: 'completed' },
    siteDetails: { status: 'completed' },
    publicRegister: { status: 'completed' }
  }
}

export const testScenarios = [
  {
    name: 'Shapefile upload',
    exemption: {
      ...baseExemption,
      siteDetails: [
        {
          ...baseExemption.siteDetails[0],
          coordinateSystem: 'wgs84',
          fileUploadType: 'shapefile',
          uploadedFile: {
            filename: 'Cavendish_Dock_Boundary_Polygon_WGS84.zip'
          }
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: ['Project summary', 'Site details', 'Public register'],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction',
        'Type of activity': 'Deposit of a substance or object',
        'Why this activity is exempt':
          "Based on your answers from 'Check if you need a marine licence', your activity is exempt under Article 17 of the Marine Licensing (Exempted Activities) Order 2011 (opens in new tab)",
        "Your answers from 'Check if you need a marine licence'": [
          'Download a copy of your answers (PDF)',
          "If you need to change any of your 'Check if you need a marine licence' answers:",
          'Delete this project from your projects.',
          'Restart the process by checking if you need a marine licence.'
        ]
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
      siteDetails: [
        {
          ...baseExemption.siteDetails[0],
          coordinateSystem: 'wgs84',
          fileUploadType: 'kml',
          uploadedFile: { filename: 'coordinates.kml' }
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: ['Project summary', 'Site details', 'Public register'],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
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
      siteDetails: [
        {
          ...baseExemption.siteDetails[0],
          coordinateSystem: 'osgb36',
          fileUploadType: 'shapefile',
          uploadedFile: { filename: 'OSGB36_Site_Boundary.zip' }
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: ['Project summary', 'Site details', 'Public register'],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
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
  },
  {
    name: 'Manual coordinates - WGS84 single point',
    exemption: {
      ...baseExemption,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: {
            latitude: '54.726200',
            longitude: '-1.599400'
          },
          circleWidth: '100'
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: ['Project summary', 'Site details', 'Public register'],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteDetails: {
        'Method of providing site location':
          'Manually enter one set of coordinates and a width to create a circular site',
        'Coordinate system':
          'WGS84 (World Geodetic System 1984) Latitude and longitude',
        'Coordinates at centre of site': '54.726200, -1.599400',
        'Width of circular site': '100 metres',
        'Map view': ''
      },
      publicRegister: {
        'Information withheld from public register': 'No'
      },
      submitButton: 'Confirm and send'
    }
  },
  {
    name: 'Manual coordinates - OSGB36 single point',
    exemption: {
      ...baseExemption,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'osgb36',
          coordinates: {
            eastings: '425053',
            northings: '564180'
          },
          circleWidth: '100'
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: ['Project summary', 'Site details', 'Public register'],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteDetails: {
        'Method of providing site location':
          'Manually enter one set of coordinates and a width to create a circular site',
        'Coordinate system': 'OSGB36 (National Grid) Eastings and Northings',
        'Coordinates at centre of site': '425053, 564180',
        'Width of circular site': '100 metres',
        'Map view': ''
      },
      publicRegister: {
        'Information withheld from public register': 'No'
      },
      submitButton: 'Confirm and send'
    }
  },
  {
    name: 'Polygon coordinates - WGS84 multiple points',
    exemption: {
      ...baseExemption,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'wgs84',
          coordinates: [
            { latitude: '54.721000', longitude: '-1.595000' },
            { latitude: '54.725000', longitude: '-1.590000' },
            { latitude: '54.729000', longitude: '-1.585000' }
          ],
          circleWidth: '100'
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: ['Project summary', 'Site details', 'Public register'],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteDetails: {
        'Method of providing site location':
          'Manually enter multiple sets of coordinates to mark the boundary of the site',
        'Coordinate system':
          'WGS84 (World Geodetic System 1984) Latitude and longitude',
        'Start and end points': '54.721000, -1.595000',
        'Point 2': '54.725000, -1.590000',
        'Point 3': '54.729000, -1.585000',
        'Map view': ''
      },
      publicRegister: {
        'Information withheld from public register': 'No'
      },
      submitButton: 'Confirm and send'
    }
  },
  {
    name: 'Polygon coordinates - OSGB36 multiple points',
    exemption: {
      ...baseExemption,
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'multiple',
          coordinateSystem: 'osgb36',
          coordinates: [
            { eastings: '425053', northings: '564180' },
            { eastings: '426000', northings: '565000' },
            { eastings: '427000', northings: '566000' }
          ],
          circleWidth: '100'
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: ['Project summary', 'Site details', 'Public register'],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteDetails: {
        'Method of providing site location':
          'Manually enter multiple sets of coordinates to mark the boundary of the site',
        'Coordinate system': 'OSGB36 (National Grid) Eastings and Northings',
        'Start and end points': '425053, 564180',
        'Point 2': '426000, 565000',
        'Point 3': '427000, 566000',
        'Map view': ''
      },
      publicRegister: {
        'Information withheld from public register': 'No'
      },
      submitButton: 'Confirm and send'
    }
  }
]
