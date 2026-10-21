import { createLogger } from '#src/server/common/helpers/logging/logger.js'
import { USER_ROLE_TYPES } from '#src/server/common/constants/user-types.js'

// 3 - Complete (approved)
const ROLE_STATUS_APPROVED = '3'

const parseRole = (role) => {
  const [relationshipId, roleName, status] = role.split(':')
  return { relationshipId, roleName, status }
}

const getRoleName = (roles, currentRelationshipId) => {
  const role = roles
    .map(parseRole)
    .find(({ relationshipId }) => relationshipId === currentRelationshipId)

  if (role?.status !== ROLE_STATUS_APPROVED) {
    return null
  }

  return role.roleName
}

const defaultUserRelationshipType = 'Citizen'

// Employee - user picked an organisation they are an employee of
// Agent - user picked an organisation they are an intermediary of
// Citizen - EITHER, the user selected themselves in the org picker (not an organisation), OR they don't have any linked organisations
const getRelationshipType = (relationshipRoleType) => {
  if (!['Employee', 'Agent', 'Citizen'].includes(relationshipRoleType)) {
    const logger = createLogger()
    logger.error(`Invalid relationship type: ${relationshipRoleType}`)
    return defaultUserRelationshipType
  }

  return relationshipRoleType
}

const getNameDisplayFlags = ({
  hasMultipleOrgPickerEntries,
  userRelationshipType,
  userRoleType
}) => {
  const shouldShowOrgOrUserName =
    hasMultipleOrgPickerEntries ||
    userRelationshipType === 'Employee' ||
    userRoleType === USER_ROLE_TYPES.CONSULTEE

  const shouldShowCitizenName =
    !shouldShowOrgOrUserName && userRelationshipType === 'Citizen'

  return { shouldShowOrgOrUserName, shouldShowCitizenName }
}

export const getOrganisationFromToken = (decodedToken) => {
  // currentRelationshipId is the relationship the user is signing into the service in the context of, based on what they selected in the organisation picker (either themselves, or a linked org)
  // relationships - The relationships the user has selected to sign into the service in, within their current session.
  // enrolmentCount - The number of enrolments assigned to the user for this service, across all organisations.
  // The roles related to the relationship the user has selected within their current session.
  const { currentRelationshipId, relationships, enrolmentCount, roles } =
    decodedToken
  if (
    !currentRelationshipId ||
    !enrolmentCount ||
    !Array.isArray(relationships) ||
    !Array.isArray(roles)
  ) {
    return {
      hasMultipleOrgPickerEntries: false,
      userRelationshipType: defaultUserRelationshipType,
      userRoleType: null,
      shouldShowCitizenName: true
    }
  }
  const relationship = relationships.find((r) =>
    r.startsWith(currentRelationshipId)
  )

  // destructure the relationships array eg
  // 81d48d6c-6e94-f011-b4cc-000d3ac28f39:27d48d6c-6e94-f011-b4cc-000d3ac28f39:CDP Child Org 1:0:Employee:0
  // which is colon-separated with the following parts:
  // relationshipId:organisationId:organisationName:organisationLoa:relationshipType:relationshipLoa.
  const [, organisationId, organisationName, , relationshipRoleType] =
    relationship?.split(':') || []

  // destructure the roles array eg
  // 23950a2d-c37d-43da-9fcb-0a4ce9aa11ee:Consultee:3
  // which is colon-separated with the following parts:
  // relationshipId:roleName:roleStatus
  // Consultee - user selected in dynamics to be consultee
  const userRoleType = getRoleName(roles, currentRelationshipId)

  const userRelationshipType = getRelationshipType(relationshipRoleType)

  const hasMultipleOrgPickerEntries =
    enrolmentCount > roles.length || relationships.length > 1

  const { shouldShowOrgOrUserName, shouldShowCitizenName } =
    getNameDisplayFlags({
      hasMultipleOrgPickerEntries,
      userRelationshipType,
      userRoleType
    })

  return {
    organisationId,
    organisationName,
    userRelationshipType,
    userRoleType,
    hasMultipleOrgPickerEntries,
    shouldShowOrgOrUserName,
    shouldShowCitizenName
  }
}
