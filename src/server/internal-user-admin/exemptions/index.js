import { internalBackfillUserAdminRoutes } from './backfill-areas/index.js'
import { internalEmpUserAdminRoutes } from './emp/index.js'
import { internalExemptionLandingUserAdminRoutes } from './landing/index.js'
import { internalReportsUserAdminRoutes } from './reports/index.js'

export const internalExemptionsUserAdminRoutes = [
  ...internalBackfillUserAdminRoutes,
  ...internalEmpUserAdminRoutes,
  ...internalReportsUserAdminRoutes,
  ...internalExemptionLandingUserAdminRoutes
]
