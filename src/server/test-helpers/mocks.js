import { faker } from '@faker-js/faker'
import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'

export const mockExemptionTaskList = {
  projectName: 'COMPLETED',
  activityDates: 'COMPLETED',
  publicRegister: 'COMPLETED',
  siteDetails: 'COMPLETED'
}

export const mcmsAnswersDownloadUrl =
  'https://marinelicensing.marinemanagement.org.uk/path/journey/self-service/outcome-document/b87ae3f7-48f3-470d-b29b-5a5abfdaa49f'

export const mockExemptionMcmsContext = {
  activity: {
    code: 'DEPOSIT',
    label: 'Deposit of a substance or object',
    purpose: 'Scientific instruments and associated equipment',
    subType: 'scientificResearch'
  },
  articleCode: '17',
  pdfDownloadUrl: mcmsAnswersDownloadUrl,
  iatQueryString: '?activity=DEPOSIT&articleCode=17'
}

export const mockExemption = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  publicRegister: { consent: 'no', reason: 'Test reason' },
  multipleSiteDetails: {
    multipleSitesEnabled: false,
    sameActivityDates: 'yes',
    sameActivityDescription: 'yes'
  },
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'single',
      coordinateSystem: COORDINATE_SYSTEMS.WGS84,
      coordinates: { latitude: '51.489676', longitude: '-0.231530' },
      circleWidth: '100',
      siteName: 'Mock site',
      activityDates: {
        start: '2025-01-01T00:00:00.000Z',
        end: '2025-01-01T00:00:00.000Z'
      },
      activityDescription: 'Test activity description'
    },
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'single',
      coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
      coordinates: { eastings: '532000', northings: '182000' },
      circleWidth: '50',
      siteName: 'Mock site 2',
      activityDates: {
        start: '2025-02-01T00:00:00.000Z',
        end: '2025-02-01T00:00:00.000Z'
      },
      activityDescription: 'Test activity description 2'
    }
  ],
  taskList: mockExemptionTaskList,
  mcmsContext: mockExemptionMcmsContext
}

export const mockExemptionSubmitted = {
  ...mockExemption,
  applicationReference: 'EXE/2025/10264'
}
export const mockExemptionWithShapefile = {
  ...mockExemption,
  siteDetails: [
    { ...mockExemption.siteDetails[0], fileUploadType: 'shapefile' }
  ]
}
export const mockFileUploadExemption = {
  ...mockExemption,
  siteDetails: [
    {
      coordinatesType: 'file',
      fileUploadType: 'kml',
      siteName: 'test site name',
      uploadedFile: {
        filename: 'test-upload-id'
      },
      s3Location: {
        checksumSha256: 'test-checksum',
        s3Bucket: 'test-bucket',
        s3Key: 'test-key'
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
      },
      activityDates: {
        start: '2025-01-01T00:00:00.000Z',
        end: '2025-01-01T00:00:00.000Z'
      },
      activityDescription: 'Test activity description'
    }
  ]
}

export const mockExemptionNoSiteDetails = {
  ...mockExemption,
  siteDetails: null,
  multipleSiteDetails: null,
  taskList: null
}

export const mockExemptionWithUploadConfig = {
  ...mockExemption,
  siteDetails: [
    {
      ...mockExemption.siteDetails[0],
      uploadConfig: {
        uploadId: 'test-upload-id',
        statusUrl: 'test-status-url',
        fileType: 'kml'
      }
    }
  ]
}

export const mockProjectList = [
  {
    id: 'abc123',
    projectName: 'Test Project',
    reference: 'ML-2024-001',
    status: 'Draft',
    submittedAt: null
  }
]

export const mockSite = {
  siteIndex: 0,
  siteNumber: 1,
  queryParams: '',
  siteDetails: mockExemption.siteDetails[0]
}

export const mockRequestAuth = {
  strategy: 'defra-id',
  credentials: { userId: 'test-user' }
}

export const createMockRequest = (overrides = {}) => ({
  params: {},
  query: {},
  payload: {},
  headers: {},
  yar: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    flash: vi.fn(),
    commit: vi.fn()
  },
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  },
  ...overrides
})
