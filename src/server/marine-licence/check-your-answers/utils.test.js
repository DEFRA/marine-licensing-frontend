import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { waterFrameworkDirective } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getWaterFrameworkDirectiveChangeLink } from '#src/server/marine-licence/check-your-answers/utils.js'

describe('getWaterFrameworkDirectiveChangeLink', () => {
  it('should return review answers route when nauticalMile is yes', () => {
    const result = getWaterFrameworkDirectiveChangeLink(waterFrameworkDirective)

    expect(result).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS}`
    )
  })

  it('should return nautical mile route when nauticalMile is no', () => {
    const result = getWaterFrameworkDirectiveChangeLink({
      ...waterFrameworkDirective,
      nauticalMile: 'no'
    })

    expect(result).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_NAUTICAL_MILE}`
    )
  })

  it('should return review answers route when nauticalMile is undefined', () => {
    const result = getWaterFrameworkDirectiveChangeLink({
      ...waterFrameworkDirective,
      nauticalMile: undefined
    })

    expect(result).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS}`
    )
  })

  it('should return  null route when water framework directive is undefined', () => {
    const result = getWaterFrameworkDirectiveChangeLink()

    expect(result).toBe(undefined)
  })
})
