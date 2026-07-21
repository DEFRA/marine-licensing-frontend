const QUERY_STARTED_AT_KEY = 'marinePlanPolicyQueryStartedAt'

export function storeMarinePlanPolicyQueryStartTime(request) {
  request.yar.set(QUERY_STARTED_AT_KEY, Date.now())
}

export function getMarinePlanPolicyQueryStartTime(request) {
  return request.yar.get(QUERY_STARTED_AT_KEY)
}
