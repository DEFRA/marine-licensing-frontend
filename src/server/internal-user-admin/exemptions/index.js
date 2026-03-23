import { internalBackfillUserAdminRoutes } from './backfill-areas/index.js'
import { internalEmpUserAdminRoutes } from './emp/index.js'
import { internalExemptionLandingUserAdminRoutes } from './landing/index.js'

export const internalExemptionsUserAdminRoutes = [
  ...internalBackfillUserAdminRoutes,
  ...internalEmpUserAdminRoutes,
  ...internalExemptionLandingUserAdminRoutes
]
