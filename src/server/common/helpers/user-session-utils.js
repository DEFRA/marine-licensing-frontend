import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import { USER_TYPES } from '#src/server/common/constants/user-types.js'

export const isIndividualUser = async (request) => {
  const { userRelationshipType } = await getUserSession(
    request,
    request.state?.userSession
  )
  return userRelationshipType === USER_TYPES.CITIZEN
}
