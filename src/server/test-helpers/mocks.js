import { faker } from '@faker-js/faker'

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
    coordinateSystem: 'osgb36',
    coordinates: { latitude: '54.978252', longitude: '-1.617780' }
  },
  taskList: mockExemptionTaskList
}
