const baseExemption = {
  id: 'test-exemption-123',
  projectName: 'Hammersmith pontoon construction',
  multipleSiteDetails: {
    multipleSitesEnabled: false
  },
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
      },
      activityDates: {
        start: '2025-01-01T00:00:00.000Z',
        end: '2025-01-31T00:00:00.000Z'
      },
      activityDescription: 'Test activity description'
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
      summaryCards: [
        'Project summary',
        'Providing the site location',
        'Site details',
        'Sharing your project information publicly'
      ],
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
      siteDetails: [
        {
          'Activity dates': '1 January 2025 to 31 January 2025',
          'Activity description': 'Test activity description',
          'Map view': ''
        }
      ],
      publicRegister: {
        'Consent to publish your project information': 'No'
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
      summaryCards: [
        'Project summary',
        'Providing the site location',
        'Site details',
        'Sharing your project information publicly'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteDetails: {
        'Activity dates': '1 January 2025 to 31 January 2025',
        'Activity description': 'Test activity description',
        'Map view': ''
      },
      publicRegister: {
        'Consent to publish your project information': 'No'
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
      summaryCards: [
        'Project summary',
        'Providing the site location',
        'Site details',
        'Sharing your project information publicly'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteDetails: {
        'Activity dates': '1 January 2025 to 31 January 2025',
        'Activity description': 'Test activity description',
        'Map view': ''
      },
      publicRegister: {
        'Consent to publish your project information': 'No'
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
          circleWidth: '100',
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-31T00:00:00.000Z'
          },
          activityDescription: 'Test activity description'
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: [
        'Project summary',
        'Providing the site location',
        'Site details',
        'Sharing your project information publicly'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteDetails: {
        'Activity dates': '1 January 2025 to 31 January 2025',
        'Activity description': 'Test activity description',
        'Single or multiple sets of coordinates':
          'Enter one set of coordinates and a width to create a circular site',
        'Coordinate system':
          'WGS84 (World Geodetic System 1984) Latitude and longitude',
        'Coordinates at centre of site': '54.726200, -1.599400',
        'Width of circular site': '100 metres',
        'Map view': ''
      },
      publicRegister: {
        'Consent to publish your project information': 'No'
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
          circleWidth: '100',
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-31T00:00:00.000Z'
          },
          activityDescription: 'Test activity description'
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: [
        'Project summary',
        'Providing the site location',
        'Site details',
        'Sharing your project information publicly'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteDetails: {
        'Activity dates': '1 January 2025 to 31 January 2025',
        'Activity description': 'Test activity description',
        'Single or multiple sets of coordinates':
          'Enter one set of coordinates and a width to create a circular site',
        'Coordinate system':
          'British National Grid (OSGB36) Eastings and Northings',
        'Coordinates at centre of site': '425053, 564180',
        'Width of circular site': '100 metres',
        'Map view': ''
      },
      publicRegister: {
        'Consent to publish your project information': 'No'
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
          circleWidth: '100',
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-31T00:00:00.000Z'
          },
          activityDescription: 'Test activity description'
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: [
        'Project summary',
        'Providing the site location',
        'Site details',
        'Sharing your project information publicly'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteDetails: {
        'Activity dates': '1 January 2025 to 31 January 2025',
        'Activity description': 'Test activity description',
        'Single or multiple sets of coordinates':
          'Enter multiple sets of coordinates to mark the boundary of the site',
        'Coordinate system':
          'WGS84 (World Geodetic System 1984) Latitude and longitude',
        'Start and end points': '54.721000, -1.595000',
        'Point 2': '54.725000, -1.590000',
        'Point 3': '54.729000, -1.585000',
        'Map view': ''
      },
      publicRegister: {
        'Consent to publish your project information': 'No'
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
          circleWidth: '100',
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-31T00:00:00.000Z'
          },
          activityDescription: 'Test activity description'
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: [
        'Project summary',
        'Providing the site location',
        'Site details',
        'Sharing your project information publicly'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteDetails: {
        'Activity dates': '1 January 2025 to 31 January 2025',
        'Activity description': 'Test activity description',
        'Single or multiple sets of coordinates':
          'Enter multiple sets of coordinates to mark the boundary of the site',
        'Coordinate system':
          'British National Grid (OSGB36) Eastings and Northings',
        'Start and end points': '425053, 564180',
        'Point 2': '426000, 565000',
        'Point 3': '427000, 566000',
        'Map view': ''
      },
      publicRegister: {
        'Consent to publish your project information': 'No'
      },
      submitButton: 'Confirm and send'
    }
  },
  {
    name: 'Multiple sites - manual coordinates with different activity dates',
    exemption: {
      ...baseExemption,
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'no',
        sameActivityDescription: 'yes'
      },
      siteDetails: [
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: {
            latitude: '54.726200',
            longitude: '-1.599400'
          },
          circleWidth: '100',
          siteName: 'North Dock',
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-01-31T00:00:00.000Z'
          },
          activityDescription: 'Pontoon construction works'
        },
        {
          coordinatesType: 'coordinates',
          coordinatesEntry: 'single',
          coordinateSystem: 'wgs84',
          coordinates: {
            latitude: '54.730000',
            longitude: '-1.610000'
          },
          circleWidth: '150',
          siteName: 'South Dock',
          activityDates: {
            start: '2025-02-01T00:00:00.000Z',
            end: '2025-02-28T00:00:00.000Z'
          },
          activityDescription: 'Pontoon construction works'
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: [
        'Project summary',
        'Providing the site location',
        'Activity details',
        'Site 1 details',
        'Site 2 details',
        'Sharing your project information publicly'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteLocation: {
        'Method of providing site location':
          'Enter the coordinates of the site manually',
        'More than one site': 'Yes'
      },
      activityDetails: {
        'Are the activity dates the same for every site?': 'No',
        'Is the activity description the same for every site?': 'Yes',
        'Activity description': 'Pontoon construction works'
      },
      siteDetails: [
        {
          'Site name': 'North Dock',
          'Activity dates': '1 January 2025 to 31 January 2025',
          'Single or multiple sets of coordinates':
            'Enter one set of coordinates and a width to create a circular site',
          'Coordinate system':
            'WGS84 (World Geodetic System 1984) Latitude and longitude',
          'Coordinates at centre of site': '54.726200, -1.599400',
          'Width of circular site': '100 metres',
          'Map view': ''
        },
        {
          'Site name': 'South Dock',
          'Activity dates': '1 February 2025 to 28 February 2025',
          'Single or multiple sets of coordinates':
            'Enter one set of coordinates and a width to create a circular site',
          'Coordinate system':
            'WGS84 (World Geodetic System 1984) Latitude and longitude',
          'Coordinates at centre of site': '54.730000, -1.610000',
          'Width of circular site': '150 metres',
          'Map view': ''
        }
      ],
      publicRegister: {
        'Consent to publish your project information': 'No'
      },
      submitButton: 'Confirm and send'
    }
  },
  {
    name: 'Multiple sites - file upload with different descriptions',
    exemption: {
      ...baseExemption,
      multipleSiteDetails: {
        multipleSitesEnabled: true,
        sameActivityDates: 'yes',
        sameActivityDescription: 'no'
      },
      siteDetails: [
        {
          coordinatesType: 'file',
          coordinateSystem: 'wgs84',
          fileUploadType: 'kml',
          uploadedFile: { filename: 'site1.kml' },
          siteName: 'North Site',
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-12-31T00:00:00.000Z'
          },
          activityDescription: 'Dredging and survey work',
          geoJSON: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [-1.2345, 50.9876]
                }
              }
            ]
          }
        },
        {
          coordinatesType: 'file',
          coordinateSystem: 'wgs84',
          fileUploadType: 'kml',
          uploadedFile: { filename: 'site2.kml' },
          siteName: 'South Site',
          activityDates: {
            start: '2025-01-01T00:00:00.000Z',
            end: '2025-12-31T00:00:00.000Z'
          },
          activityDescription: 'Cable laying operations',
          geoJSON: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [-1.25, 50.99]
                }
              }
            ]
          }
        }
      ]
    },
    expectedPageContent: {
      pageTitle: 'Check your answers before sending your information',
      backLinkText: 'Go back to your project',
      summaryCards: [
        'Project summary',
        'Providing the site location',
        'Activity details',
        'Site 1 details',
        'Site 2 details',
        'Sharing your project information publicly'
      ],
      projectDetails: {
        'Project name': 'Hammersmith pontoon construction'
      },
      siteLocation: {
        'Method of providing site location':
          'Upload a file with the coordinates of the site',
        'File type': 'KML',
        'File uploaded': 'site1.kml'
      },
      activityDetails: {
        'Are the activity dates the same for every site?': 'Yes',
        'Activity dates': '1 January 2025 to 31 December 2025',
        'Is the activity description the same for every site?': 'No'
      },
      siteDetails: [
        {
          'Site name': 'North Site',
          'Activity description': 'Dredging and survey work',
          'Map view': ''
        },
        {
          'Site name': 'South Site',
          'Activity description': 'Cable laying operations',
          'Map view': ''
        }
      ],
      publicRegister: {
        'Consent to publish your project information': 'No'
      },
      submitButton: 'Confirm and send'
    }
  }
]
