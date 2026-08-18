import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

export const getCancelLink = (request) => {
  const returnTo = request.yar.get(RETURN_TO_CACHE_KEY)
  return returnTo ? undefined : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}

export const getContinueLink = (request) => {
  const returnTo = request.yar.get(RETURN_TO_CACHE_KEY)

  return returnTo
    ? `${returnTo}#fee-estimate-card`
    : marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
}
