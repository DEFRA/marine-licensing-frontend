import { MARINE_LICENCE_KEY } from '#src/server/common/constants/marine-licence.js'
import { faker } from '@faker-js/faker'

export const mockMarineLicenceTaskList = {
  projectName: 'COMPLETED',
  specialLegalPowers: 'COMPLETED',
  otherAuthorities: 'COMPLETED',
  siteDetails: 'COMPLETED',
  preferredDates: 'COMPLETED',
  projectBackground: 'COMPLETED',
  publicRegister: 'COMPLETED',
  publicConsultation: 'COMPLETED',
  waterFrameworkDirective: 'COMPLETED'
}

export const mockEmptyActivityDetails = {
  activityType: '',
  activitySubType: '',
  activities: {},
  activityDescription: '',
  activityDuration: '',
  completionDate: {},
  activityMonths: {},
  workingHours: ''
}

export const mockActivityDetails = {
  activityType: 'construction',
  activitySubType: 'construction-type-1',
  activities: { selections: ['CON1'] },
  activityDescription: 'Test description',
  completionDate: { date: 'yes', reason: 'Test completion' },
  activityDuration: { years: 1, months: 4 },
  activityMonths: { months: 'yes', details: 'Test months' },
  workingHours: 'Test hours'
}

export const mockOutputActivityDetails = {
  ...mockActivityDetails,
  activityType: 'Construction of new works',
  activityDuration: '1 year, 4 months',
  completionDate: mockActivityDetails.completionDate.reason,
  activityMonths: mockActivityDetails.activityMonths.details
}

export const mockOutputEmptyActivityDetails = {
  ...mockEmptyActivityDetails,
  completionDate: null,
  activityMonths: null
}

export const waterFrameworkDirective = {
  nauticalMile: 'yes',
  excludedActivities: 'no',
  uploadedFile: {
    filename: 'test-upload-id'
  },
  s3Location: {
    checksumSha256: 'test-checksum',
    s3Bucket: 'test-bucket',
    s3Key: 'test-key'
  }
}

export const mockMarineLicenceApplication = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  projectBackground: 'Test project background',
  specialLegalPowers: { agree: 'yes', details: 'Test reason' },
  publicConsultation: {
    consulted: 'yes',
    details: 'Consulted with local fishing group'
  },
  taskList: mockMarineLicenceTaskList,
  preferredDates: {
    start: { month: '07', year: '2026' },
    end: { month: '08', year: '2027' }
  },
  projectType: MARINE_LICENCE_KEY,
  siteDetails: [
    {
      activityDetails: [mockActivityDetails, mockActivityDetails],
      coordinatesType: 'file',
      fileUploadType: 'kml',
      siteName: 'test site name',
      featureCount: 1,
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
      }
    }
  ],
  waterFrameworkDirective
}

export const mockSubmittedMarineLicenceApplication = {
  ...mockMarineLicenceApplication,
  status: 'Submitted',
  applicationReference: 'MLA/2026/10264'
}

export const mockFileUploadMarineLicence = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      activityDetails: [mockActivityDetails],
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
      }
    }
  ]
}

export const mockManualCoordinatesMarineLicence = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      siteName: 'Test site name'
    }
  ]
}

export const mockCircularMarineLicence = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'single',
      coordinateSystem: 'wgs84',
      coordinates: { latitude: '55.123456', longitude: '55.123456' },
      circleWidth: '100',
      siteName: 'Circular Test Site'
    }
  ]
}

export const mockPolygonMarineLicence = {
  ...mockMarineLicenceApplication,
  siteDetails: [
    {
      coordinatesType: 'coordinates',
      coordinatesEntry: 'multiple',
      coordinateSystem: 'wgs84',
      coordinates: [
        { latitude: '55.123456', longitude: '55.123456' },
        { latitude: '33.987654', longitude: '33.987654' },
        { latitude: '78.123456', longitude: '78.123456' }
      ],
      siteName: 'Polygon Test Site'
    }
  ]
}
