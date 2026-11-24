import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { waterFrameworkDirective } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  getPublicRegisterChangeLink,
  getWaterFrameworkDirectiveChangeLink
} from '#src/server/marine-licence/check-your-answers/utils.js'

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

describe('getPublicRegisterChangeLink', () => {
  it('links to the review withholding answers page when withholding', () => {
    expect(
      getPublicRegisterChangeLink({
        withholdConsent: 'yes',
        withholdReason: 'commercialConfidentiality',
        reason: 'Pricing'
      })
    ).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_CHECK_ANSWERS}?from=check-your-answers`
    )
  })

  it.each([
    { name: 'not withholding', publicRegister: { withholdConsent: 'no' } },
    { name: 'unanswered', publicRegister: undefined }
  ])('links to the withholding question when $name', ({ publicRegister }) => {
    expect(getPublicRegisterChangeLink(publicRegister)).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER}?from=check-your-answers`
    )
  })
})
