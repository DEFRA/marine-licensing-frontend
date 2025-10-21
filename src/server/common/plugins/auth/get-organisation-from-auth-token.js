import { createLogger } from '#src/server/common/helpers/logging/logger.js'

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
      hasMultipleOrganisations: false
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

  // Employee - user picked an organisation they are an employee of
  // Agent - user picked an organisation they are an intermediary of
  // Citizen - EITHER, the user selected themselves in the org picker (not an organisation), OR they don't have any linked organisations
  let userRelationshipType = relationshipRoleType
  if (!['Employee', 'Agent', 'Citizen'].includes(userRelationshipType)) {
    const logger = createLogger()
    logger.error(`Invalid relationship type: ${userRelationshipType}`)
    userRelationshipType = 'Citizen'
  }

  const hasMultipleOrganisations =
    enrolmentCount > roles.length || relationships.length > 1

  return {
    organisationId,
    organisationName,
    userRelationshipType,
    hasMultipleOrganisations
  }
}
