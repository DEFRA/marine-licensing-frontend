export const generateHeadingText = (userSession) => {
  const { displayName } = userSession
  return `Confirm you're notifying us as ${displayName} for a personal project`
}
