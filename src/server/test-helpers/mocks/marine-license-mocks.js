import { faker } from '@faker-js/faker'
import { mockExemptionMcmsContext } from './exemption'

export const mockMarineLicenseTaskList = {
  projectName: 'COMPLETED'
}

export const mockMarineLicenseApplication = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  taskList: mockMarineLicenseTaskList,
  mcmsContext: mockExemptionMcmsContext
}
