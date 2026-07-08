import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

export const getMarinePlanPolicyLink = (policyCode) =>
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY.replace(
    '{policyCode}',
    encodeURIComponent(policyCode)
  )
