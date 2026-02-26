import { faker } from '@faker-js/faker'
import { mockExemptionMcmsContext } from './exemption'

export const mockMarineLicenceTaskList = {
  projectName: 'COMPLETED'
}

export const mockMarineLicenceApplication = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  taskList: mockMarineLicenceTaskList,
  mcmsContext: mockExemptionMcmsContext
}
