import {
  routes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'
import { getBackLink } from '#src/server/declaration/utils.js'

describe('#getBackLink', () => {
  test('returns exemption check your answers route for exemption type', () => {
    expect(getBackLink(PROJECT_TYPE.EXEMPTION)).toBe(routes.CHECK_YOUR_ANSWERS)
  })

  test('returns marine licence check your answers route for marine licence type', () => {
    expect(getBackLink(PROJECT_TYPE.MARINE_LICENCE)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )
  })

  test('returns marine licence check your answers route for unknown type', () => {
    expect(getBackLink(undefined)).toBe(
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )
  })
})
