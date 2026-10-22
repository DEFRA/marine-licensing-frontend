import {
  USER_ROLE_TYPES,
  USER_TYPES
} from '#src/server/common/constants/user-types.js'

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
  shouldShowOrgOrUserName: false
}

export const consulteeSession = {
  ...employeeSession,
  userRoleType: USER_ROLE_TYPES.CONSULTEE,
  organisationName: 'Consultee Org'
}

export const agentSessionWithMultipleOrgs = {
  ...agentSession,
  hasMultipleOrgPickerEntries: true
}
