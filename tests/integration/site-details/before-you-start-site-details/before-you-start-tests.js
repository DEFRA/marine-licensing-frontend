import { getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

export function sharedBeforeYouStartSiteDetailsTests({
  request,
  projectName,
  navLinks,
  projectType
}) {
  test('should display the before you start page with correct content', async () => {
    const { result, statusCode } = await request()

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', { name: 'Site details' })
    ).toBeInTheDocument()
    expect(getByText(document, projectName)).toBeInTheDocument()

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
    const { result } = await request()

    const { document } = new JSDOM(result).window

    const continueButton = getByRole(document, 'button', { name: 'Continue' })
    expect(continueButton).toHaveAttribute('href', navLinks.continueHref)

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', navLinks.backHref)
  })

  test('should display all required content sections in structured lists', async () => {
    const { result } = await request()

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

    if (projectType === 'exemptions') {
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
        getByText(
          document,
          'upload a shapefile or KML file with the coordinates'
        )
      ).toBeInTheDocument()
      expect(
        getByText(document, 'enter the coordinates manually')
      ).toBeInTheDocument()
    }

    if (projectType === 'marineLicence') {
      expect(
        getByText(document, 'type of activity, for example construction')
      ).toBeInTheDocument()

      expect(
        getByText(
          document,
          'category of activity, for example maintenance construction'
        )
      ).toBeInTheDocument()

      expect(getByText(document, 'activity description')).toBeInTheDocument()

      expect(
        getByText(document, 'maximum duration of the activity')
      ).toBeInTheDocument()

      expect(
        getByText(document, 'schedule of when the activity will take place')
      ).toBeInTheDocument()
      expect(
        getByText(
          document,
          'possible impacts of the activity and ways to reduce them'
        )
      ).toBeInTheDocument()
    }

    expect(
      getByText(document, 'upload a shapefile or KML file with the coordinates')
    ).toBeInTheDocument()
    expect(
      getByText(document, 'enter the coordinates manually')
    ).toBeInTheDocument()
  })

  test('should have properly structured lists for accessibility', async () => {
    const { result } = await request()

    const { document } = new JSDOM(result).window

    const lists = document.querySelectorAll('ul.govuk-list--bullet')
    expect(lists).toHaveLength(2)

    const firstList = lists[0]
    expect(firstList).toContainElement(getByText(document, 'a site name'))

    const secondList = lists[1]
    expect(secondList).toContainElement(
      getByText(document, 'upload a shapefile or KML file with the coordinates')
    )
  })
}
