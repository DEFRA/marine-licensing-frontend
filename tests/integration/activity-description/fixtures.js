import { mockExemption } from '#src/server/test-helpers/mocks.js'

export const exemptionNoActivityDescription = {
  ...mockExemption,
  siteDetails: [{ ...mockExemption.siteDetails[0], activityDescription: null }]
}
