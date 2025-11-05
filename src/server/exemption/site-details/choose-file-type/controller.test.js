import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { routes } from '#src/server/common/constants/routes.js'
import { JSDOM } from 'jsdom'
import {
  chooseFileTypeController,
  chooseFileTypeSubmitController,
  CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE,
  errorMessages
} from '#src/server/exemption/site-details/choose-file-type/controller.js'

import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#chooseFileType', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy

  const mockExemptionState = {
    projectName: 'Test Project',
    siteDetails: [{ fileUploadType: 'shapefile' }]
  }

  beforeEach(() => {
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemptionState)
  })

  describe('#chooseFileTypeController', () => {
    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: routes.CHOOSE_FILE_UPLOAD_TYPE,
        server: getServer()
      })

      const { document } = new JSDOM(result).window

      expect(
        document.querySelector(
          'input[name="fileUploadType"][value="shapefile"]:checked'
        )
      ).toBeTruthy()
      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should provide expected response and correctly not pre-populate data if it is not present', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({})

      const { result, statusCode } = await makeGetRequest({
        url: routes.CHOOSE_FILE_UPLOAD_TYPE,
        server: getServer()
      })

      const { document } = new JSDOM(result).window
      expect(
        document.querySelector('input[name="fileUploadType"]:checked')
      ).toBeFalsy()
      expect(statusCode).toBe(statusCodes.ok)
    })

    test('chooseFileTypeController handler should render view with correct page title, heading, and pre-populated data from cache', () => {
      const h = { view: vi.fn() }

      chooseFileTypeController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE, {
        pageTitle: 'Choose file type',
        heading: 'Which type of file do you want to upload?',
        payload: {
          fileUploadType: mockExemptionState.siteDetails[0].fileUploadType
        },
        projectName: mockExemptionState.projectName,
        backLink: routes.COORDINATES_TYPE_CHOICE
      })

      getExemptionCacheSpy.mockReturnValueOnce({}) // exmpty excemption cache object

      chooseFileTypeController.handler({}, h)

      expect(h.view).toHaveBeenNthCalledWith(
        2,
        CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE,
        {
          pageTitle: 'Choose file type',
          heading: 'Which type of file do you want to upload?',
          payload: { fileUploadType: '' },
          projectName: undefined, // nothing in the cache
          backLink: routes.COORDINATES_TYPE_CHOICE
        }
      )
    })

    test('Should render details and summary elements', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: routes.CHOOSE_FILE_UPLOAD_TYPE,
        server: getServer()
      })

      const { document } = new JSDOM(result).window

      const detailsElement = document.querySelector('.govuk-details')
      expect(detailsElement).toBeTruthy()

      const summaryElement = document.querySelector('.govuk-details__summary')
      expect(summaryElement).toBeTruthy()
      expect(summaryElement.textContent.trim()).toBe('Help with file types')

      const shapefileHeading = document.querySelector('.govuk-details h2')
      expect(shapefileHeading).toBeTruthy()
      expect(shapefileHeading.textContent.trim()).toBe('Shapefile')

      const shapefileDescription = document.querySelector('.govuk-details p')
      expect(shapefileDescription).toBeTruthy()
      expect(shapefileDescription.textContent.trim()).toMatch(
        /^A shapefile is a collection of files that store map data\./
      )

      const kmlHeading = document.querySelectorAll('.govuk-details h2')[1]
      expect(kmlHeading).toBeTruthy()
      expect(kmlHeading.textContent.trim()).toBe('KML')

      const kmlDescription = document.querySelectorAll('.govuk-details p')[1]
      expect(kmlDescription).toBeTruthy()
      expect(kmlDescription.textContent.trim()).toMatch(
        /^A KML file \(Keyhole Markup Language\) is used to store map data\./
      )

      expect(statusCode).toBe(statusCodes.ok)
    })
  })

  describe('#chooseFileTypeSubmitController', () => {
    test('Should show error messages with invalid data', async () => {
      const { result, statusCode } = await makePostRequest({
        url: routes.CHOOSE_FILE_UPLOAD_TYPE,
        server: getServer(),
        formData: { fileUploadType: '' }
      })

      const { document } = new JSDOM(result).window

      expect(document.querySelector('.govuk-error-summary')).toBeTruthy()
      expect(
        document.querySelector('.govuk-error-summary__list').textContent
      ).toContain(errorMessages.FILE_TYPE_ENTRY_REQUIRED)

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should correctly validate on empty data', () => {
      const request = {
        payload: { fileUploadType: '' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
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

      expect(h.view).toHaveBeenCalledWith(CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE, {
        pageTitle: 'Choose file type',
        heading: 'Which type of file do you want to upload?',
        projectName: mockExemptionState.projectName,
        payload: { fileUploadType: '' },
        backLink: routes.COORDINATES_TYPE_CHOICE,
        errorSummary: [
          {
            href: '#fileUploadType',
            text: errorMessages.FILE_TYPE_ENTRY_REQUIRED,
            field: ['fileUploadType']
          }
        ],
        errors: {
          fileUploadType: {
            field: ['fileUploadType'],
            href: '#fileUploadType',
            text: errorMessages.FILE_TYPE_ENTRY_REQUIRED
          }
        }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly handle an incorrectly formed error object', () => {
      const request = {
        payload: { fileUploadType: '' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {
        details: null
      }

      chooseFileTypeSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(CHOOSE_FILE_UPLOAD_TYPE_VIEW_ROUTE, {
        pageTitle: 'Choose file type',
        heading: 'Which type of file do you want to upload?',
        projectName: mockExemptionState.projectName,
        payload: { fileUploadType: '' },
        backLink: routes.COORDINATES_TYPE_CHOICE
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should successfully update exemption cache and return 302 status code', async () => {
      const updateExemptionSiteDetailsSpy = vi.spyOn(
        cacheUtils,
        'updateExemptionSiteDetails'
      )

      const { statusCode } = await makePostRequest({
        url: routes.CHOOSE_FILE_UPLOAD_TYPE,
        server: getServer(),
        formData: { fileUploadType: 'shapefile' }
      })

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        0,
        'fileUploadType',
        'shapefile'
      )

      expect(statusCode).toBe(statusCodes.redirect)
    })
  })
})
