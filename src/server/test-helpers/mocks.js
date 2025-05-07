import { faker } from '@faker-js/faker'

export const mockExemptionTaskList = {
  projectName: 'COMPLETED'
}

export const mockExemption = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  taskList: mockExemptionTaskList
}
