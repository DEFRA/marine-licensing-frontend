import { getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Check Your Answers - File Upload Site Details Integration Tests', () => {
  let server

  const baseExemption = {
    id: 'test-exemption-123',
    projectName: 'Hammersmith pontoon construction',
    activityDates: {
      start: '2025-07-01',
      end: '2025-07-07'
    },
    activityDescription: {
      description:
        'We will be installing a pontoon approximately 20 metres squared at the east of our garden that backs onto the river.'
    },
    siteDetails: {
      coordinatesType: 'file',
      fileUploadType: 'shapefile',
      uploadedFile: {
        filename: 'Cavendish_Dock_Boundary_Polygon_WGS84.zip'
      },
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-1.2345, 50.9876],
                  [-1.2335, 50.9876],
                  [-1.2335, 50.9886],
                  [-1.2345, 50.9886],
                  [-1.2345, 50.9876]
                ]
              ]
            }
          }
        ]
      }
    },
    publicRegister: {
      withholdFromPublicRegister: false
    },
    taskList: {
      projectName: { status: 'completed' },
      activityDates: { status: 'completed' },
      activityDescription: { status: 'completed' },
      siteDetails: { status: 'completed' },
      publicRegister: { status: 'completed' }
    }
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    // Mock the session cache to return our base exemption data
    jest.spyOn(cacheUtils, 'getExemptionCache').mockReturnValue(baseExemption)
    jest
      .spyOn(cacheUtils, 'setExemptionCache')
      .mockImplementation(() => undefined)

    // Mock the API call that check-your-answers controller makes (just for validation)
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValue({
      payload: { value: { taskList: { id: baseExemption.id } } }
    })
  })

  test('should display file upload site details on check your answers page', async () => {
    const response = await server.inject({
      method: 'GET',
      url: routes.CHECK_YOUR_ANSWERS
    })

    expect(response.statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(response.result).window

    // Verify main page structure
    expect(
      getByText(document, 'Check your answers before sending your information')
    ).toBeInTheDocument()

    // Verify project name caption (should appear twice - in caption and summary card)
    const projectNameElements = document.querySelectorAll('*')
    const projectNameTexts = Array.from(projectNameElements).filter(
      (el) =>
        el.textContent && el.textContent.trim() === baseExemption.projectName
    )
    expect(projectNameTexts.length).toBeGreaterThanOrEqual(1)

    // Find and verify the site details section
    const siteDetailsHeading = getByText(document, 'Site details')
    expect(siteDetailsHeading).toBeInTheDocument()

    // Verify site details content based on what I observed in the live application
    expect(
      getByText(document, 'Method of providing site location')
    ).toBeInTheDocument()
    expect(
      getByText(document, 'Upload a file with the coordinates of the site')
    ).toBeInTheDocument()

    expect(getByText(document, 'File type')).toBeInTheDocument()
    expect(getByText(document, 'Shapefile')).toBeInTheDocument()

    expect(getByText(document, 'File uploaded')).toBeInTheDocument()
    expect(
      getByText(document, 'Cavendish_Dock_Boundary_Polygon_WGS84.zip')
    ).toBeInTheDocument()
  })
})
