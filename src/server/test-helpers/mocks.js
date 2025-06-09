import { faker } from '@faker-js/faker'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'

export const mockExemptionTaskList = {
  projectName: 'COMPLETED',
  publicRegister: 'COMPLETED'
}

export const mockExemption = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  publicRegister: { consent: 'yes', reason: 'Test reason' },
  siteDetails: {
    coordinatesType: 'coordinates',
    coordinatesEntry: 'single',
    coordinateSystem: COORDINATE_SYSTEMS.WGS84,
    coordinates: { latitude: '54.978252', longitude: '-1.617780' },
    circleWidth: '100'
  },
  taskList: mockExemptionTaskList
}
