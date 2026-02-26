import { routes } from '#src/server/common/constants/routes.js'

export const generateBackLink = ({ userTypeIndividual, userTypeEmployee }) => {
  if (userTypeIndividual) {
    return routes.postLogin.CONFIRM_INDIVIDUAL
  }

  if (userTypeEmployee) {
    return routes.postLogin.CONFIRM_EMPLOYEE
  }

  return routes.postLogin.CONFIRM_AGENT
}
