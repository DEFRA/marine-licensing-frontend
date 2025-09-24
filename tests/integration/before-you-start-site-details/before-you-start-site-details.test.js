import { getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'

import { setupTestServer } from '../shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('Before you start site details page', () => {
  const mockExemption = {
    id: 'test-exemption-123',
    projectName: 'Test Project'
  }

  const getServer = setupTestServer()

  beforeEach(() => {
    jest.mocked(getExemptionCache).mockReturnValue(mockExemption)
  })

  test('should display the before you start page with correct content', async () => {
    const { result, statusCode } = await makeGetRequest({
      server: getServer(),
      url: routes.SITE_DETAILS
    })

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', { name: 'Site details' })
    ).toBeInTheDocument()
    expect(getByText(document, mockExemption.projectName)).toBeInTheDocument()

    expect(
      getByRole(document, 'heading', { name: 'Before you start' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Providing site locations' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Defining the site boundary' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Projects with multiple sites' })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toBeInTheDocument()
  })

  test('should have correct navigation links', async () => {
    const { result } = await makeGetRequest({
      server: getServer(),
      url: routes.SITE_DETAILS
    })

    const { document } = new JSDOM(result).window

    const continueButton = getByRole(document, 'button', { name: 'Continue' })
    expect(continueButton).toHaveAttribute(
      'href',
      '/exemption/how-do-you-want-to-provide-the-coordinates'
    )

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', '/exemption/task-list')
  })

  test('should display all required content sections', async () => {
    const { result } = await makeGetRequest({
      server: getServer(),
      url: routes.SITE_DETAILS
    })

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', { name: 'Before you start' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Providing site locations' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Defining the site boundary' })
    ).toBeInTheDocument()

    expect(getByText(document, 'a site name')).toBeInTheDocument()
    expect(
      getByText(document, 'the exact location of the site')
    ).toBeInTheDocument()
    expect(
      getByText(document, 'the dates the activity will take place')
    ).toBeInTheDocument()
    expect(
      getByText(document, 'a description of the activity')
    ).toBeInTheDocument()

    expect(
      getByText(document, 'upload a file with the coordinates')
    ).toBeInTheDocument()
    expect(
      getByText(document, 'enter the coordinates manually')
    ).toBeInTheDocument()
  })

  test('should have properly structured lists for accessibility', async () => {
    const { result } = await makeGetRequest({
      server: getServer(),
      url: routes.SITE_DETAILS
    })

    const { document } = new JSDOM(result).window

    const lists = document.querySelectorAll('ul.govuk-list--bullet')
    expect(lists).toHaveLength(2)

    const firstList = lists[0]
    expect(firstList).toContainElement(getByText(document, 'a site name'))
    expect(firstList).toContainElement(
      getByText(document, 'the exact location of the site')
    )
    expect(firstList).toContainElement(
      getByText(document, 'the dates the activity will take place')
    )
    expect(firstList).toContainElement(
      getByText(document, 'a description of the activity')
    )

    const secondList = lists[1]
    expect(secondList).toContainElement(
      getByText(document, 'upload a file with the coordinates')
    )
    expect(secondList).toContainElement(
      getByText(document, 'enter the coordinates manually')
    )
  })
})
