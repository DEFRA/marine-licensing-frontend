import { vi } from 'vitest'
import { within } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import * as authenticatedRequests from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('#src/server/common/helpers/authenticated-requests.js')

describe('Confirm change activity type', () => {
  mockMarineLicence(mockMarineLicenceApplication)

  const getServer = setupTestServer()

  test('displays the warning with Yes/Cancel actions', async () => {
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRM_CHANGE_ACTIVITY_TYPE}?site=1&activity=1&activityType=construction&activitySubType=construction-type-2`,
      server: getServer()
    })

    within(document).getByRole('heading', {
      level: 1,
      name: 'Changing your type of activity will delete any uploaded construction drawings'
    })

    within(document).getByRole('button', { name: 'Yes, change activity' })

    const insetText = document.querySelector('.govuk-inset-text')
    expect(insetText).toHaveTextContent('construction of new marine works')
    expect(insetText).toHaveTextContent(
      'alteration or improvement, including extending, of existing marine works'
    )

    const cancelLink = within(document).getByRole('link', { name: 'Cancel' })
    expect(cancelLink).toHaveAttribute(
      'href',
      '/marine-licence/type-of-activity?site=1&activity=1'
    )
  })

  test('redirects to the task list when activityType/activitySubType are missing or invalid', async () => {
    const response = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRM_CHANGE_ACTIVITY_TYPE}?site=1&activity=1`,
      server: getServer()
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('confirming saves the pending activity type and continues to the sub-activity screen', async () => {
    const response = await makePostRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRM_CHANGE_ACTIVITY_TYPE}?site=1&activity=1`,
      server: getServer(),
      formData: {
        site: '1',
        activity: '1',
        activityType: 'construction',
        activitySubType: 'construction-type-2'
      }
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(
      '/marine-licence/activity-details/what-are-you-maintaining?site=1&activity=1'
    )
  })

  test('confirming deletes the site construction drawings when no other activity on the site needs one', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          activityDetails: [
            mockMarineLicenceApplication.siteDetails[0].activityDetails[0]
          ],
          constructionDrawings: [{ filename: 'drawing-1.pdf' }]
        }
      ]
    })

    const response = await makePostRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRM_CHANGE_ACTIVITY_TYPE}?site=1&activity=1`,
      server: getServer(),
      formData: {
        site: '1',
        activity: '1',
        activityType: 'construction',
        activitySubType: 'construction-type-2'
      }
    })

    expect(response.statusCode).toBe(302)
    expect(
      vi.mocked(authenticatedRequests.authenticatedPatchRequest)
    ).toHaveBeenCalledWith(
      expect.anything(),
      apiRoutes.DELETE_CONSTRUCTION_DRAWINGS,
      {
        id: mockMarineLicenceApplication.id,
        siteIndex: 0
      }
    )
  })

  test('confirming does not delete the site construction drawings when another activity on the site still requires one', async () => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      siteDetails: [
        {
          ...mockMarineLicenceApplication.siteDetails[0],
          constructionDrawings: [{ filename: 'drawing-1.pdf' }]
        }
      ]
    })

    const response = await makePostRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_CONFIRM_CHANGE_ACTIVITY_TYPE}?site=1&activity=1`,
      server: getServer(),
      formData: {
        site: '1',
        activity: '1',
        activityType: 'construction',
        activitySubType: 'construction-type-2'
      }
    })

    expect(response.statusCode).toBe(302)
    expect(
      vi.mocked(authenticatedRequests.authenticatedPatchRequest)
    ).not.toHaveBeenCalledWith(
      expect.anything(),
      apiRoutes.DELETE_CONSTRUCTION_DRAWINGS,
      expect.anything()
    )
  })
})
