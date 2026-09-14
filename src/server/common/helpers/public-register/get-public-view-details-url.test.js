import { describe, expect, test } from 'vitest'
import { getPublicViewDetailsUrl } from './get-public-view-details-url.js'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import { PROJECT_TYPE } from '#src/server/common/constants/projects.js'

describe('#getPublicViewDetailsUrl', () => {
  test('returns the exemption public view details route', () => {
    expect(getPublicViewDetailsUrl(PROJECT_TYPE.EXEMPTION, 'abc123')).toBe(
      `${routes.VIEW_DETAILS_PUBLIC}/abc123`
    )
  })

  test('returns the marine licence public view details route', () => {
    expect(
      getPublicViewDetailsUrl(PROJECT_TYPE.MARINE_LICENCE, 'licence-123')
    ).toBe(
      `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_PUBLIC}/licence-123`
    )
  })

  test('defaults to the exemption route for unknown application types', () => {
    expect(getPublicViewDetailsUrl('unknown', 'abc123')).toBe(
      `${routes.VIEW_DETAILS_PUBLIC}/abc123`
    )
  })
})
