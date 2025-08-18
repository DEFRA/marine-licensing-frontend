import { faker } from '@faker-js/faker'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'

export const mockExemptionTaskList = {
  projectName: 'COMPLETED',
  activityDates: 'COMPLETED',
  publicRegister: 'COMPLETED',
  siteDetails: 'COMPLETED'
}

export const mockExemption = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  activityDates: {
    start: '2025-01-01T00:00:00.000Z',
    end: '2025-01-01T00:00:00.000Z'
  },
  activityDescription: 'Test activity description',
  publicRegister: { consent: 'yes', reason: 'Test reason' },
  siteDetails: {
    coordinatesType: 'coordinates',
    coordinatesEntry: 'single',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    coordinates: { latitude: '51.489676', longitude: '-0.231530' },
    circleWidth: '100'
  },
  taskList: mockExemptionTaskList
}

export const mockExemptionWithShapefile = {
  ...mockExemption,
  siteDetails: { ...mockExemption.siteDetails, fileUploadType: 'shapefile' }
}

export const mockExemptionWithUploadConfig = {
  ...mockExemption,
  siteDetails: {
    ...mockExemption.siteDetails,
    uploadConfig: {
      uploadId: 'test-upload-id',
      statusUrl: 'test-status-url',
      fileType: 'kml'
    }
  }
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
