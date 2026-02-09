const displayName = 'Test User'

const baseSession = {
  displayName,
  organisationName: null,
  hasMultipleOrgPickerEntries: false,
  shouldShowOrgOrUserName: false
}

export const citizenUserSession = {
  ...baseSession,
  userRelationshipType: 'Citizen'
}

export const employeeSession = {
  ...baseSession,
  userRelationshipType: 'Employee',
  organisationName: 'Test Org',
  shouldShowOrgOrUserName: true
}

export const agentSession = {
  ...baseSession,
  userRelationshipType: 'Agent',
  organisationName: 'Client Org',
  shouldShowOrgOrUserName: true
}
