import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { waterFrameworkDirective } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getChangeLink } from '#src/server/marine-licence/check-your-answers/utils.js'

describe('getChangeLink', () => {
  it('should return review answers route when nauticalMile is yes', () => {
    const result = getChangeLink(waterFrameworkDirective)

    expect(result).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    )
  })

  it('should return nautical mile route when nauticalMile is no', () => {
    const result = getChangeLink({
      ...waterFrameworkDirective,
      nauticalMile: 'no'
    })

    expect(result).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE
    )
  })

  it('should return review answers route when nauticalMile is undefined', () => {
    const result = getChangeLink({
      ...waterFrameworkDirective,
      nauticalMile: undefined
    })

    expect(result).toBe(
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    )
  })

  it('should return  null route when water framework directive is undefined', () => {
    const result = getChangeLink()

    expect(result).toBe(undefined)
  })
})
