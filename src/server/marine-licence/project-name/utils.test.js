import { marineLicenseRoutes } from '#src/server/common/constants/routes.js'
import { getBackLink } from './utils'

describe('projectName utils', () => {
  test('correct backLink for update route', () => {
    expect(getBackLink(true)).toEqual(
      marineLicenseRoutes.MARINE_LICENSE_TASK_LIST
    )
  })

  test('correct backLink for landing page route', () => {
    expect(getBackLink(false)).toEqual(null)
  })
})
