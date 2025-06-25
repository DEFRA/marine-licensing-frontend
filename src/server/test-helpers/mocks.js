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
