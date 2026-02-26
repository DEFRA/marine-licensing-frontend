export const generateHeadingText = (userSession) => {
  const { organisationName } = userSession
  return `Are you notifying us as an employee of ${organisationName}?`
}

export const generateErrorText = (userSession) => {
  const { organisationName } = userSession
  return `Select whether you are notifying us for ${organisationName}`
}
