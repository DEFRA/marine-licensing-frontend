export const toPublicRegister = ({ consent, reason }) => ({
  consent,
  ...(consent === 'yes' && { reason })
})
