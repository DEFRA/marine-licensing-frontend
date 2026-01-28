import { faker } from '@faker-js/faker'
import { mockExemptionMcmsContext } from './exemption'

export const mockMarineLicenseApplication = {
  id: faker.database.mongodbObjectId(),
  projectName: 'Test Project',
  mcmsContext: mockExemptionMcmsContext
}
