import { apiRoutes } from '#src/server/common/constants/routes.js'
import { authenticatedPostRequest } from '#src/server/common/helpers/authenticated-requests.js'

const QUERY_STARTED_AT_KEY = 'marinePlanPolicyQueryStartedAt'

export function storeMarinePlanPolicyQueryStartTime(request) {
  request.yar.set(QUERY_STARTED_AT_KEY, Date.now())
}

export function getMarinePlanPolicyQueryStartTime(request) {
  return request.yar.get(QUERY_STARTED_AT_KEY)
}

export async function triggerMarinePlanPolicyQuery(request, marineLicenceId) {
  await authenticatedPostRequest(
    request,
    apiRoutes.CALCULATE_MARINE_PLAN_POLICIES,
    JSON.stringify({ id: marineLicenceId })
  )
  storeMarinePlanPolicyQueryStartTime(request)
}
