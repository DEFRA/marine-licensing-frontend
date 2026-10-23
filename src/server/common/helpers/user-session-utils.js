import { getUserSession } from '#src/server/common/plugins/auth/utils.js'
import {
  USER_ROLE_TYPES,
  USER_TYPES
} from '#src/server/common/constants/user-types.js'

export const isIndividualUser = async (request) => {
  const userSession = await getUserSession(request, request.state?.userSession)
  return userSession?.userRelationshipType === USER_TYPES.CITIZEN
}

export const isConsulteeUser = (request) =>
  request?.auth?.credentials?.userRoleType === USER_ROLE_TYPES.CONSULTEE
