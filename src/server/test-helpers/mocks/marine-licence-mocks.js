import { MARINE_LICENCE_KEY } from '#src/server/common/constants/marine-licence.js'
import { faker } from '@faker-js/faker'

export const mockMarineLicenceTaskList = {
  projectName: 'COMPLETED',
  specialLegalPowers: 'COMPLETED',
  siteDetails: 'COMPLETED',
  publicRegister: 'COMPLETED',
  otherAuthorities: 'COMPLETED'
}

export const mockMarineLicenceApplication = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  specialLegalPowers: { agree: 'yes', details: 'Test reason' },
  taskList: mockMarineLicenceTaskList,
  projectType: MARINE_LICENCE_KEY,
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
