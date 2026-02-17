import { generateBackLink } from '#src/server/defraid-post-login/guidance-org/utils.js'
import { routes } from '#src/server/common/constants/routes.js'

describe('#generateBackLink', () => {
  test('should correctly format back link for individual user', () => {
    const result = generateBackLink({ userTypeIndividual: 'yes' })

    expect(result).toBe(routes.postLogin.CONFIRM_INDIVIDUAL)
  })

  test('should correctly format back link for employee user', () => {
    const result = generateBackLink({ userTypeEmployee: 'yes' })

    expect(result).toBe(routes.postLogin.CONFIRM_EMPLOYEE)
  })

  test('should correctly format back link for agent user', () => {
    const result = generateBackLink({ userTypeAgent: 'yes' })

    expect(result).toBe(routes.postLogin.CONFIRM_AGENT)
  })
})
