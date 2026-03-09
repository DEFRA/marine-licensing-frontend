import { MARINE_LICENCE_KEY } from '#src/server/common/constants/marine-licence.js'
import { faker } from '@faker-js/faker'

export const mockMarineLicenceTaskList = {
  projectName: 'COMPLETED'
}

export const mockMarineLicenceApplication = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  taskList: mockMarineLicenceTaskList,
  projectType: MARINE_LICENCE_KEY
}
