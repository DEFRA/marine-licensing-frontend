import { describe, expect, test } from 'vitest'
import { getApplicationTypeLabel } from './get-application-type-label.js'
import { EXEMPTION_TYPE } from '#src/server/common/constants/exemptions.js'
import { MARINE_LICENCE_TYPE } from '#src/server/common/constants/marine-licence.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'

describe('#getApplicationTypeLabel', () => {
  test('returns exempt activity notification for exemptions', () => {
    expect(getApplicationTypeLabel(PROJECT_TYPE.EXEMPTION)).toBe(EXEMPTION_TYPE)
  })

  test('returns marine licence application for marine licences', () => {
    expect(getApplicationTypeLabel(PROJECT_TYPE.MARINE_LICENCE)).toBe(
      MARINE_LICENCE_TYPE
    )
  })

  test('returns the application type when unknown', () => {
    expect(getApplicationTypeLabel('other-type')).toBe('other-type')
  })

  test('returns a dash when application type is missing', () => {
    expect(getApplicationTypeLabel()).toBe('-')
  })
})
