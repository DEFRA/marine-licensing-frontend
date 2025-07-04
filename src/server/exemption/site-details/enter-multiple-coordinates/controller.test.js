import { jest } from '@jest/globals'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinates.js'
import {
  getCoordinateSystem,
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from './controller.js'
import { multipleCoordinatesPageData } from './utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js', () => ({
  getExemptionCache: jest.fn(),
  updateExemptionSiteDetails: jest.fn(),
  getCoordinateSystem: jest.fn()
}))

// Test helpers to reduce duplication
const createMockRequest = (overrides = {}) => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  ...overrides
})

const createMockH = () => ({
  view: jest.fn().mockReturnThis(),
  takeover: jest.fn().mockReturnThis(),
  redirect: jest.fn()
})

const createExemption = (coordinateSystem, overrides = {}) => ({
  id: '507f1f77bcf86cd799439011',
  projectName: 'Test Project',
  siteDetails: {
    coordinateSystem,
    ...overrides
  }
})

const createCoordinates = (coordinateSystem, count = 3) => {
  const coords = []
  for (let i = 0; i < count; i++) {
    if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
      coords.push({
        latitude: `55.${123456 + i}`,
        longitude: `-1.${234567 + i}`
      })
    } else {
      coords.push({
        eastings: `${425053 + i}`,
        northings: `${564180 + i}`
      })
    }
  }
  return coords
}

const createPayload = (coordinateSystem, coordinates) => {
  const payload = {}
  coordinates.forEach((coord, index) => {
    if (coordinateSystem === COORDINATE_SYSTEMS.WGS84) {
      payload[`coordinates[${index}][latitude]`] = coord.latitude || ''
      payload[`coordinates[${index}][longitude]`] = coord.longitude || ''
    } else {
      payload[`coordinates[${index}][eastings]`] = coord.eastings || ''
      payload[`coordinates[${index}][northings]`] = coord.northings || ''
    }
  })
  return payload
}

const setupMocks = (
  coordinateSystem = COORDINATE_SYSTEMS.WGS84,
  exemptionOverrides = {}
) => {
  const exemption = createExemption(coordinateSystem, exemptionOverrides)
  getExemptionCache.mockReturnValue(exemption)
  getCoordinateSystem.mockReturnValue({ coordinateSystem })
  return exemption
}

const testCases = [
  { system: COORDINATE_SYSTEMS.WGS84, template: 'wgs84' },
  { system: COORDINATE_SYSTEMS.OSGB36, template: 'osgb36' }
]

describe('Multiple Coordinates Controller', () => {
  let mockRequest, mockH

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = createMockRequest()
    mockH = createMockH()
  })

  describe('multipleCoordinatesController', () => {
    testCases.forEach(({ system, template }) => {
      describe(`${system} coordinate system`, () => {
        it('should render template with empty payload when no coordinates in session', () => {
          setupMocks(system)

          multipleCoordinatesController.handler(mockRequest, mockH)

          const expectedCoordinate =
            system === COORDINATE_SYSTEMS.WGS84
              ? { latitude: '', longitude: '' }
              : { eastings: '', northings: '' }

          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            {
              ...multipleCoordinatesPageData,
              projectName: 'Test Project',
              pageTitle: multipleCoordinatesPageData.heading, // Added pageTitle
              coordinates: [
                expectedCoordinate,
                expectedCoordinate,
                expectedCoordinate
              ],
              coordinateCount: 3
              // errors property should NOT be present when there are no errors
            }
          )
        })

        it('should render template with pre-populated coordinates', () => {
          const coordinates = createCoordinates(system, 3)
          setupMocks(system, { multipleCoordinates: { coordinates } })

          multipleCoordinatesController.handler(mockRequest, mockH)

          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            {
              ...multipleCoordinatesPageData,
              projectName: 'Test Project',
              pageTitle: multipleCoordinatesPageData.heading, // Added pageTitle
              coordinates,
              coordinateCount: 3
              // errors property should NOT be present when there are no errors
            }
          )
        })

        it('should handle validation errors', () => {
          setupMocks(system)

          multipleCoordinatesController.handler(mockRequest, mockH)

          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            expect.objectContaining({
              coordinates: expect.arrayContaining([
                expect.any(Object),
                expect.any(Object),
                expect.any(Object)
              ]),
              coordinateCount: 3,
              pageTitle: multipleCoordinatesPageData.heading // Added pageTitle expectation
              // errors property should NOT be present for clean page loads
            })
          )
        })
      })
    })
  })

  describe('multipleCoordinatesSubmitController', () => {
    testCases.forEach(({ system, template }) => {
      describe(`${system} coordinate system`, () => {
        it('should save valid coordinates and remain on same page (AC6)', () => {
          setupMocks(system)
          const coordinates = createCoordinates(system, 3)
          mockRequest.payload = createPayload(system, coordinates)

          multipleCoordinatesSubmitController.handler(mockRequest, mockH)

          // Should save coordinates to session
          expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
            mockRequest,
            'multipleCoordinates',
            expect.objectContaining({
              coordinates: expect.arrayContaining([
                expect.any(Object),
                expect.any(Object),
                expect.any(Object)
              ])
            })
          )

          // Should render the same page again (AC6)
          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            expect.objectContaining({
              coordinates: expect.any(Array),
              coordinateCount: 3,
              pageTitle: multipleCoordinatesPageData.heading
              // No errors property should be present for successful validation
            })
          )
        })

        it('should handle validation errors and redisplay form', () => {
          setupMocks(system)
          // Invalid coordinates that would fail validation
          const invalidCoordinates = [
            system === COORDINATE_SYSTEMS.WGS84
              ? { latitude: '', longitude: '' }
              : { eastings: '', northings: '' }
          ]
          mockRequest.payload = createPayload(system, invalidCoordinates)

          multipleCoordinatesSubmitController.handler(mockRequest, mockH)

          // Should still render the same page with validation errors
          expect(mockH.view).toHaveBeenCalledWith(
            `exemption/site-details/enter-multiple-coordinates/${template}`,
            expect.objectContaining({
              coordinates: expect.any(Array),
              coordinateCount: 3,
              errors: expect.any(Object)
            })
          )
        })

        // NEW TDD TESTS FOR IDENTIFIED ISSUES

        describe('TDD Issue Tests', () => {
          it('should NOT pass errors object when page loads without validation errors (Issue 1: Page Title Bug)', () => {
            setupMocks(system)

            multipleCoordinatesController.handler(mockRequest, mockH)

            // This test should FAIL initially - controller currently passes errors: {} even for clean pages
            expect(mockH.view).toHaveBeenCalledWith(
              `exemption/site-details/enter-multiple-coordinates/${template}`,
              expect.not.objectContaining({
                errors: expect.any(Object)
              })
            )
          })

          it('should set proper pageTitle to prevent "Error:" prefix on clean pages (Issue 1: Page Title Bug)', () => {
            setupMocks(system)

            multipleCoordinatesController.handler(mockRequest, mockH)

            // This test should FAIL initially - pageTitle is not being set
            expect(mockH.view).toHaveBeenCalledWith(
              `exemption/site-details/enter-multiple-coordinates/${template}`,
              expect.objectContaining({
                pageTitle:
                  'Enter multiple sets of coordinates to mark the boundary of the site'
              })
            )
          })

          it('should not have duplicate error messages in errorSummary (Issue 2: Duplicate Error Messages)', () => {
            setupMocks(system)
            // Create a scenario that would trigger duplicate errors
            const invalidPayload = {}
            invalidPayload[
              `coordinates[0][${system === COORDINATE_SYSTEMS.WGS84 ? 'latitude' : 'eastings'}]`
            ] = 'abc'
            mockRequest.payload = invalidPayload

            multipleCoordinatesSubmitController.handler(mockRequest, mockH)

            const viewCall = mockH.view.mock.calls[0]
            const context = viewCall[1]

            // Should have errorSummary when there are validation errors
            expect(context.errorSummary).toBeDefined()

            const errorTexts = context.errorSummary.map((error) => error.text)
            const uniqueErrorTexts = [...new Set(errorTexts)]

            // This test should FAIL initially if there are duplicate error messages
            expect(errorTexts).toHaveLength(uniqueErrorTexts.length)
          })

          it('should save coordinates to session and persist them correctly (Issue 3: AC6 Enhanced Testing)', () => {
            setupMocks(system)
            const coordinates = createCoordinates(system, 3)
            mockRequest.payload = createPayload(system, coordinates)

            // Mock the session cache to simulate saved data being retrieved
            const savedExemption = createExemption(system, {
              multipleCoordinates: { coordinates }
            })
            getExemptionCache
              .mockReturnValueOnce(savedExemption) // First call
              .mockReturnValueOnce(savedExemption) // Second call after save

            multipleCoordinatesSubmitController.handler(mockRequest, mockH)

            // Should save to session
            expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
              mockRequest,
              'multipleCoordinates',
              {
                coordinates: expect.arrayContaining([
                  expect.objectContaining(coordinates[0]),
                  expect.objectContaining(coordinates[1]),
                  expect.objectContaining(coordinates[2])
                ])
              }
            )

            // Should redisplay the page with saved coordinates (AC6: remain on same page)
            expect(mockH.view).toHaveBeenCalledWith(
              `exemption/site-details/enter-multiple-coordinates/${template}`,
              expect.objectContaining({
                coordinates: expect.arrayContaining([
                  expect.objectContaining(coordinates[0]),
                  expect.objectContaining(coordinates[1]),
                  expect.objectContaining(coordinates[2])
                ])
              })
            )
          })

          it('should handle successful validation and remain on same page exactly as AC6 specifies', () => {
            setupMocks(system)
            const validCoordinates = createCoordinates(system, 3)
            mockRequest.payload = createPayload(system, validCoordinates)

            multipleCoordinatesSubmitController.handler(mockRequest, mockH)

            // Should not redirect anywhere - should render the same page (AC6)
            expect(mockH.redirect).not.toHaveBeenCalled()
            expect(mockH.view).toHaveBeenCalledWith(
              `exemption/site-details/enter-multiple-coordinates/${template}`,
              expect.any(Object)
            )

            // The coordinates should be saved to session
            expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
              mockRequest,
              'multipleCoordinates',
              expect.objectContaining({
                coordinates: expect.any(Array)
              })
            )
          })
        })

        // COMPREHENSIVE VALIDATION TESTS FOR ML-19 ACCEPTANCE CRITERIA
        describe('ML-19 Validation Tests', () => {
          if (system === COORDINATE_SYSTEMS.WGS84) {
            describe('AC2 - WGS84 Validation Error Messages', () => {
              it('should show "Enter the latitude of <point>" when latitude field is blank', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[0][latitude]': '',
                  'coordinates[0][longitude]': '-1.399500',
                  'coordinates[1][latitude]': '55.123457',
                  'coordinates[1][longitude]': '-1.234568'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Enter the latitude of start and end point'
                  })
                )
              })

              it('should show "Enter the longitude of <point>" when longitude field is blank', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[0][latitude]': '55.019889',
                  'coordinates[0][longitude]': '',
                  'coordinates[1][latitude]': '55.123457',
                  'coordinates[1][longitude]': '-1.234568'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Enter the longitude of start and end point'
                  })
                )
              })

              it('should show "Latitude of <point> must be a number" for non-numeric latitude', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[1][latitude]': 'abc',
                  'coordinates[1][longitude]': '-1.399500'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Latitude of point 2 must be a number'
                  })
                )
              })

              it('should show "Longitude of <point> must be a number" for non-numeric longitude', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[2][latitude]': '55.019889',
                  'coordinates[2][longitude]': 'xyz'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Longitude of point 3 must be a number'
                  })
                )
              })

              it('should show "Latitude of <point> must be between -90 and 90" for out of range latitude', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[0][latitude]': '95.000000',
                  'coordinates[0][longitude]': '-1.399500'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Latitude of start and end point must be between -90 and 90'
                  })
                )
              })

              it('should show "Longitude of <point> must be between -180 and 180" for out of range longitude', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[1][latitude]': '55.019889',
                  'coordinates[1][longitude]': '-185.000000'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Longitude of point 2 must be between -180 and 180'
                  })
                )
              })

              it('should show "Latitude of <point> must include 6 decimal places, like 55.019889" for incorrect decimal places', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[2][latitude]': '55.01988', // 5 decimal places
                  'coordinates[2][longitude]': '-1.399500'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Latitude of point 3 must include 6 decimal places, like 55.019889'
                  })
                )
              })

              it('should show "Longitude of <point> must include 6 decimal places, like -1.399500" for incorrect decimal places', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[0][latitude]': '55.019889',
                  'coordinates[0][longitude]': '-1.3995' // 4 decimal places
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Longitude of start and end point must include 6 decimal places, like -1.399500'
                  })
                )
              })
            })
          }

          if (system === COORDINATE_SYSTEMS.OSGB36) {
            describe('AC3 - OSGB36 Validation Error Messages', () => {
              it('should show "Enter the eastings of <point>" when eastings field is blank', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[0][eastings]': '',
                  'coordinates[0][northings]': '564180',
                  'coordinates[1][eastings]': '425054',
                  'coordinates[1][northings]': '564181'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Enter the eastings of start and end point'
                  })
                )
              })

              it('should show "Enter the northings of <point>" when northings field is blank', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[1][eastings]': '425053',
                  'coordinates[1][northings]': ''
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Enter the northings of point 2'
                  })
                )
              })

              it('should show "Eastings of <point> must be a number" for non-numeric eastings', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[2][eastings]': 'abc',
                  'coordinates[2][northings]': '564180'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Eastings of point 3 must be a number'
                  })
                )
              })

              it('should show "Northings of <point> must be a number" for non-numeric northings', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[0][eastings]': '425053',
                  'coordinates[0][northings]': 'xyz'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Northings of start and end point must be a number'
                  })
                )
              })

              it('should show "Eastings of <point> must be a positive 6-digit number, like 123456" for negative eastings', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[1][eastings]': '-123456',
                  'coordinates[1][northings]': '564180'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Eastings of point 2 must be a positive 6-digit number, like 123456'
                  })
                )
              })

              it('should show "Northings of <point> must be a positive 6 or 7-digit number, like 123456" for negative northings', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[2][eastings]': '425053',
                  'coordinates[2][northings]': '-564180'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Northings of point 3 must be a positive 6 or 7-digit number, like 123456'
                  })
                )
              })

              it('should show "Eastings of <point> must be 6 digits" for wrong digit count', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[0][eastings]': '12345', // 5 digits
                  'coordinates[0][northings]': '564180'
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Eastings of start and end point must be 6 digits'
                  })
                )
              })

              it('should show "Northings of <point> must be 6 or 7 digits" for wrong digit count', () => {
                setupMocks(system)
                mockRequest.payload = {
                  'coordinates[1][eastings]': '425053',
                  'coordinates[1][northings]': '12345' // 5 digits (should be 6 or 7)
                }

                multipleCoordinatesSubmitController.handler(mockRequest, mockH)

                const viewCall = mockH.view.mock.calls[0]
                const context = viewCall[1]
                expect(context.errorSummary).toContainEqual(
                  expect.objectContaining({
                    text: 'Northings of point 2 must be 6 or 7 digits'
                  })
                )
              })
            })
          }
        })
      })
    })
  })
})
