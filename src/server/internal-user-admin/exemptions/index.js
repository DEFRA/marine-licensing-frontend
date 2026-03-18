import { internalBackfillUserAdminRoutes } from './backfill-areas/index.js'
import { internalEmpUserAdminRoutes } from './emp/index.js'

export const internalExemptionsUserAdminRoutes = [
  ...internalBackfillUserAdminRoutes,
  ...internalEmpUserAdminRoutes
]
