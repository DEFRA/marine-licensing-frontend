import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  coordinatesTypeController,
  coordinatesTypeSubmitController,
  MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/coordinates-type/controller.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { JSDOM } from 'jsdom'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

const cancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`

describe('#coordinatesType', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#coordinatesTypeController', () => {
    test('handler should render with correct context', () => {
      const h = { view: vi.fn() }

      coordinatesTypeController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to provide the site location?',
          heading: 'How do you want to provide the site location?',
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
          cancelLink,
          projectName: 'Test Project',
          payload: {}
        }
      )
    })

    test('Should provide expected response', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
        server: getServer()
      })

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe(
        'How do you want to provide the site location?'
      )

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(mockMarineLicenceApplication.projectName)

      expect(document.querySelector('#coordinatesType').value).toBe('file')

      expect(document.querySelector('#coordinatesType-2').value).toBe(
        'coordinates'
      )

      expect(
        document
          .querySelector(
            `.govuk-back-link[href="${marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS}"`
          )
          .textContent.trim()
      ).toBe('Back')

      expect(
        document
          .querySelector(
            `.govuk-link[href="${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details"`
          )
          .textContent.trim()
      ).toBe('Cancel')

      expect(statusCode).toBe(statusCodes.ok)
    })
  })

  describe('#coordinatesTypeSubmitController', () => {
    test('Should correctly format error data', () => {
      const request = {
        payload: { coordinatesType: 'invalid' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['coordinatesType'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      coordinatesTypeSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE,
        {
          pageTitle: 'How do you want to provide the site location?',
          heading: 'How do you want to provide the site location?',
          projectName: 'Test Project',
          payload: { coordinatesType: 'invalid' },
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
          cancelLink,
          errorSummary: [
            {
              href: '#coordinatesType',
              text: 'TEST',
              field: ['coordinatesType']
            }
          ],
          errors: {
            coordinatesType: {
              field: ['coordinatesType'],
              href: '#coordinatesType',
              text: 'TEST'
            }
          }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly output page with no error data in object', () => {
      const request = {
        payload: { coordinatesType: 'invalid' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      coordinatesTypeSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_COORDINATES_CHOICE_VIEW_ROUTE,
        {
          backLink: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
          cancelLink,
          pageTitle: 'How do you want to provide the site location?',
          heading: 'How do you want to provide the site location?',
          projectName: 'Test Project',
          payload: { coordinatesType: 'invalid' }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should redirect to same page on successful submission', async () => {
      const h = {
        view: vi.fn(),
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      await coordinatesTypeSubmitController.handler({}, h)

      expect(h.view).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
      )
      expect(h.redirect().takeover).toHaveBeenCalled()
    })
  })
})
