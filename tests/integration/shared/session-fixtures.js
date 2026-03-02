import { USER_TYPES } from '#src/server/common/constants/user-types.js'

const displayName = 'Test User'

const baseSession = {
  displayName,
  organisationName: null,
  hasMultipleOrgPickerEntries: false,
  shouldShowOrgOrUserName: false
}

export const citizenUserSession = {
  ...baseSession,
  userRelationshipType: USER_TYPES.CITIZEN
}

export const citizenUserSessionWithMultipleRelationships = {
  ...citizenUserSession,
  hasMultipleOrgPickerEntries: true
}

export const employeeSession = {
  ...baseSession,
  userRelationshipType: 'Employee',
  organisationName: 'Test Org',
  shouldShowOrgOrUserName: true
}

export const employeeSessionWithMultipleOrgs = {
  ...employeeSession,
  hasMultipleOrgPickerEntries: true
}

export const agentSession = {
  ...baseSession,
  userRelationshipType: 'Agent',
  organisationName: 'Client Org',
  shouldShowOrgOrUserName: true
}

export const agentSessionWithMultipleOrgs = {
  ...agentSession,
  hasMultipleOrgPickerEntries: true
}
