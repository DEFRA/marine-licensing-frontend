import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { JSDOM } from 'jsdom'
import {
  chooseFileTypeController,
  chooseFileTypeSubmitController,
  MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/choose-file-type/controller.js'
import { chooseFileTypeErrorMessages } from '#src/server/common/validation/choose-file-type/constants.js'
import {
  getMarineLicenceCache,
  getSingleSiteMode
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'

vi.mock(
  '~/src/server/common/helpers/marine-licence/session-cache/utils.js',
  () => ({
    getMarineLicenceCache: vi.fn(),
    getSingleSiteMode: vi.fn().mockReturnValue(false),
    updateMarineLicenceSiteDetails: vi.fn().mockResolvedValue({})
  })
)

const defaultBackLink =
  marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE
const defaultCancelLink = `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`
const singleSiteBackLink =
  marineLicenceRoutes.MARINE_LICENCE_CHANGE_SITE_LOCATION
const singleSiteCancelLink =
  marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS

describe('#chooseFileType (marine licence)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue({
      ...mockMarineLicenceApplication,
      siteDetails: []
    })
  })

  describe('#chooseFileTypeController', () => {
    test('handler should render view with correct context', () => {
      const h = { view: vi.fn() }

      chooseFileTypeController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE,
        {
          pageTitle: 'Choose file type',
          heading: 'Which type of file do you want to upload?',
          backLink: defaultBackLink,
          cancelLink: defaultCancelLink,
          projectName: mockMarineLicenceApplication.projectName,
          payload: { fileUploadType: '' }
        }
      )
    })

    test('handler should pre-populate fileUploadType from cache', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        ...mockMarineLicenceApplication,
        siteDetails: [{ fileUploadType: 'kml' }]
      })

      const h = { view: vi.fn() }

      chooseFileTypeController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE,
        expect.objectContaining({
          payload: { fileUploadType: 'kml' }
        })
      )
    })

    test('handler should not pre-populate fileUploadType when singleSiteMode is set', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        ...mockMarineLicenceApplication,
        siteDetails: [{ fileUploadType: 'kml' }]
      })
      vi.mocked(getSingleSiteMode).mockReturnValueOnce({ siteIndex: 0 })

      const h = { view: vi.fn() }

      chooseFileTypeController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE,
        expect.objectContaining({
          payload: { fileUploadType: '' },
          backLink: singleSiteBackLink,
          cancelLink: singleSiteCancelLink
        })
      )
    })

    test('Should return 200 on GET', async () => {
      const { statusCode } = await makeGetRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })

  describe('#chooseFileTypeSubmitController', () => {
    test('Should show error messages with invalid data', async () => {
      const { result, statusCode } = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE,
        server: getServer(),
        formData: { fileUploadType: '' }
      })

      const { document } = new JSDOM(result).window

      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
      expect(
        document.querySelector('.govuk-error-summary__list').textContent
      ).toContain(chooseFileTypeErrorMessages.FILE_TYPE_ENTRY_REQUIRED)

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should correctly format error data in failAction', () => {
      const request = { payload: { fileUploadType: '' } }

      const h = {
        view: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }

      const err = {
        details: [
          {
            path: ['fileUploadType'],
            message: 'FILE_TYPE_ENTRY_REQUIRED',
            type: 'string.empty'
          }
        ]
      }

      chooseFileTypeSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE,
        {
          pageTitle: 'Choose file type',
          heading: 'Which type of file do you want to upload?',
          projectName: mockMarineLicenceApplication.projectName,
          payload: { fileUploadType: '' },
          backLink: defaultBackLink,
          cancelLink: defaultCancelLink,
          errorSummary: [
            {
              href: '#fileUploadType',
              text: chooseFileTypeErrorMessages.FILE_TYPE_ENTRY_REQUIRED,
              field: ['fileUploadType']
            }
          ],
          errors: {
            fileUploadType: {
              field: ['fileUploadType'],
              href: '#fileUploadType',
              text: chooseFileTypeErrorMessages.FILE_TYPE_ENTRY_REQUIRED
            }
          }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should handle malformed error object in failAction', () => {
      const request = { payload: { fileUploadType: '' } }

      const h = {
        view: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }

      chooseFileTypeSubmitController.options.validate.failAction(request, h, {
        details: null
      })

      expect(h.view).toHaveBeenCalledWith(
        MARINE_LICENCE_CHOOSE_FILE_TYPE_VIEW_ROUTE,
        {
          pageTitle: 'Choose file type',
          heading: 'Which type of file do you want to upload?',
          projectName: mockMarineLicenceApplication.projectName,
          payload: { fileUploadType: '' },
          backLink: defaultBackLink,
          cancelLink: defaultCancelLink
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should redirect to same page on successful submission', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }

      await chooseFileTypeSubmitController.handler(
        { payload: { fileUploadType: 'shapefile' } },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
      )
      expect(h.redirect().takeover).toHaveBeenCalled()
    })

    test('Should return 302 on valid POST', async () => {
      const { statusCode } = await makePostRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE,
        server: getServer(),
        formData: { fileUploadType: 'shapefile' }
      })

      expect(statusCode).toBe(statusCodes.redirect)
    })
  })
})
