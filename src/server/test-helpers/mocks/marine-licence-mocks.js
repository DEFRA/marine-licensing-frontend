import { MARINE_LICENCE_KEY } from '#src/server/common/constants/marine-licence.js'
import { faker } from '@faker-js/faker'

export const mockMarineLicenceTaskList = {
  projectName: 'COMPLETED',
  specialLegalPowers: 'COMPLETED',
  otherAuthorities: 'COMPLETED',
  siteDetails: 'COMPLETED',
  projectBackground: 'COMPLETED',
  publicRegister: 'COMPLETED'
}

export const mockEmptyActivityDetails = {
  activityType: '',
  activitySubType: '',
  activities: {},
  activityDescription: '',
  activityDuration: '',
  completionDate: {},
  activityMonths: '',
  workingHours: ''
}
export const mockActivityDetails = {
  activityType: 'construction',
  activitySubType: 'construction-type-1',
  activities: { selections: ['CON1'] },
  activityDescription: 'Test description',
  completionDate: { date: 'yes', reason: 'Test completion' },
  activityDuration: { years: 1, months: 4 },
  activityMonths: 'Test months',
  workingHours: 'Test hours'
}

export const mockOutputActivityDetails = {
  ...mockActivityDetails,
  activityType: 'Construction of new works',
  activityDuration: '1 year, 4 months',
  completionDate: mockActivityDetails.completionDate.reason
}

export const mockOutputEmptyActivityDetails = {
  ...mockEmptyActivityDetails,
  completionDate: null
}

export const mockMarineLicenceApplication = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  projectBackground: 'Test project background',
  specialLegalPowers: { agree: 'yes', details: 'Test reason' },
  taskList: mockMarineLicenceTaskList,
  projectType: MARINE_LICENCE_KEY,
  siteDetails: [
    {
      activityDetails: [mockActivityDetails],
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
  ]
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
