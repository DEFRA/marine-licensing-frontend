import { MARINE_LICENCE_KEY } from '#src/server/common/constants/marine-licence.js'
import { faker } from '@faker-js/faker'

export const mockMarineLicenceTaskList = {
  projectName: 'COMPLETED',
  specialLegalPowers: 'COMPLETED',
  siteDetails: 'COMPLETED'
}

export const mockMarineLicenceApplication = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  specialLegalPowers: { agree: 'yes', details: 'Test reason' },
  taskList: mockMarineLicenceTaskList,
  projectType: MARINE_LICENCE_KEY
}

export const mockSubmittedMarineLicenceApplication = {
  ...mockMarineLicenceApplication,
  status: 'Submitted',
  applicationReference: 'MLA/2026/10264'
}
