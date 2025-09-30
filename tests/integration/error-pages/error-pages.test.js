import { JSDOM } from 'jsdom'
import { getByRole, getByText } from '@testing-library/dom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

const expectContactDetailsSection = (document) => {
  const phoneHeading = getByRole(document, 'heading', {
    name: 'Phone',
    level: 2
  })
  expect(phoneHeading).toBeInTheDocument()

  const phoneNumber = getByText(document, '0191 376 2791')
  expect(phoneNumber).toBeInTheDocument()

  const emailHeading = getByRole(document, 'heading', {
    name: 'Email',
    level: 2
  })
  expect(emailHeading).toBeInTheDocument()

  const emailLink = getByRole(document, 'link', {
    name: 'marine.consents@marinemanagement.org.uk'
  })
  expect(emailLink).toBeInTheDocument()
  expect(emailLink.getAttribute('href')).toBe(
    'mailto:marine.consents@marinemanagement.org.uk'
  )

  const openingTimesHeading = getByRole(document, 'heading', {
    name: 'Opening times',
    level: 2
  })
  expect(openingTimesHeading).toBeInTheDocument()

  const mondayToThursday = getByText(
    document,
    'Monday to Thursday: 9am to 4:30pm'
  )
  expect(mondayToThursday).toBeInTheDocument()

  const friday = getByText(document, 'Friday: 9am to 4pm')
  expect(friday).toBeInTheDocument()
}

const expectGovukFrontendClasses = (document) => {
  const mainH1 = document.querySelector('.govuk-grid-column-two-thirds h1')
  if (mainH1) {
    expect(mainH1.classList.contains('govuk-heading-l')).toBe(true)
  }

  const contactDetailsH2s = document.querySelectorAll('h2.govuk-heading-m')
  expect(contactDetailsH2s.length).toBeGreaterThanOrEqual(3) // Phone, Email, Opening times

  const paragraphs = document.querySelectorAll('p.govuk-body')
  expect(paragraphs.length).toBeGreaterThan(0)

  const govukLinks = document.querySelectorAll('a.govuk-link')
  expect(govukLinks.length).toBeGreaterThan(0)
}

describe('Error Pages Integration Tests', () => {
  const getServer = setupTestServer()

  beforeAll(() => {
    const server = getServer()

    // setup some test routes
    server.route([
      {
        method: 'GET',
        path: '/test-error-403',
        handler: (request, h) => {
          return h
            .view('error/403-forbidden', {
              pageTitle: 'You do not have permission to view this page'
            })
            .code(statusCodes.forbidden)
        }
      },
      {
        method: 'GET',
        path: '/test-error-500',
        handler: (request, h) => {
          return h
            .view('error/500-server-error', {
              pageTitle: 'There is a problem with the service'
            })
            .code(statusCodes.internalServerError)
        }
      },
      {
        method: 'GET',
        path: '/test-error-503',
        handler: (request, h) => {
          return h
            .view('error/503-service-unavailable', {
              pageTitle: 'Sorry, the service is unavailable'
            })
            .code(statusCodes.serviceUnavailable)
        }
      }
    ])
  })

  describe('404 Not Found Error Page', () => {
    let document

    beforeEach(async () => {
      const { result } = await makeGetRequest({
        server: getServer(),
        url: '/this-page-does-not-exist-for-testing'
      })

      document = new JSDOM(result).window.document
    })

    test('Should render 404 error page with correct heading', () => {
      const heading = getByRole(document, 'heading', {
        name: 'Page not found',
        level: 1
      })
      expect(heading).toBeInTheDocument()
    })

    test('Should display helpful error messages for 404', () => {
      const typeMessage = getByText(
        document,
        'If you typed the web address, check it is correct.'
      )
      expect(typeMessage).toBeInTheDocument()

      const pasteMessage = getByText(
        document,
        'If you pasted the web address, check you copied the entire web address.'
      )
      expect(pasteMessage).toBeInTheDocument()

      const correctMessage = getByText(
        document,
        'If the web address is correct or you selected a link or button, contact our helpline.'
      )
      expect(correctMessage).toBeInTheDocument()
    })

    test('Should include contact details section', () => {
      expectContactDetailsSection(document)
    })

    test('Should use correct GOV.UK Design System classes', () => {
      expectGovukFrontendClasses(document)
    })
  })

  describe('403 Forbidden Error Page', () => {
    let document

    beforeEach(async () => {
      const { result } = await makeGetRequest({
        server: getServer(),
        url: '/test-error-403'
      })

      document = new JSDOM(result).window.document
    })

    test('Should render 403 error page with correct heading', () => {
      const heading = getByRole(document, 'heading', {
        name: 'You do not have permission to view this page',
        level: 1
      })
      expect(heading).toBeInTheDocument()
    })

    test('Should display contact email for access issues', () => {
      const contactText = getByText(
        document,
        /If you think you should have access, contact:/
      )
      expect(contactText).toBeInTheDocument()

      const emailLink = getByRole(document, 'link', {
        name: 'marine.consents@marinemanagement.org.uk'
      })
      expect(emailLink).toBeInTheDocument()
      expect(emailLink.getAttribute('href')).toBe(
        'mailto:marine.consents@marinemanagement.org.uk'
      )
    })

    test('Should use correct GOV.UK Design System classes', () => {
      // 403 page doesn't have contact details, so just check basic structure
      const mainH1 = document.querySelector('.govuk-grid-column-two-thirds h1')
      expect(mainH1.classList.contains('govuk-heading-l')).toBe(true)
      const paragraphs = document.querySelectorAll('p.govuk-body')
      expect(paragraphs.length).toBeGreaterThan(0)

      const govukLinks = document.querySelectorAll('a.govuk-link')
      expect(govukLinks.length).toBeGreaterThan(0)
    })
  })

  describe('500 Internal Server Error Page', () => {
    let document

    beforeEach(async () => {
      const { result } = await makeGetRequest({
        server: getServer(),
        url: '/test-error-500'
      })

      document = new JSDOM(result).window.document
    })

    test('Should render 500 error page with correct heading', () => {
      const heading = getByRole(document, 'heading', {
        name: 'There is a problem with the service',
        level: 1
      })
      expect(heading).toBeInTheDocument()
    })

    test('Should display helpful error messages for 500', () => {
      const tryAgainMessage = getByText(document, 'Try again later.')
      expect(tryAgainMessage).toBeInTheDocument()

      const dataLossMessage = getByText(
        document,
        'We have not saved your answers. When the service is available, you will have to start again.'
      )
      expect(dataLossMessage).toBeInTheDocument()

      const contactMessage = getByText(
        document,
        'Contact our helpline if you have any questions.'
      )
      expect(contactMessage).toBeInTheDocument()
    })

    test('Should include contact details section', () => {
      expectContactDetailsSection(document)
    })

    test('Should use correct GOV.UK Design System classes', () => {
      expectGovukFrontendClasses(document)
    })
  })

  describe('503 Service Unavailable Error Page', () => {
    let document

    beforeEach(async () => {
      const { result } = await makeGetRequest({
        server: getServer(),
        url: '/test-error-503'
      })

      document = new JSDOM(result).window.document
    })

    test('Should render 503 error page with correct heading', () => {
      const heading = getByRole(document, 'heading', {
        name: 'Sorry, the service is unavailable',
        level: 1
      })
      expect(heading).toBeInTheDocument()
    })

    test('Should display helpful error messages for 503', () => {
      const tryAgainMessage = getByText(document, 'Try again later.')
      expect(tryAgainMessage).toBeInTheDocument()

      const contactMessage = getByText(
        document,
        'Contact our helpline if you have any questions.'
      )
      expect(contactMessage).toBeInTheDocument()
    })

    test('Should include contact details section', () => {
      expectContactDetailsSection(document)
    })

    test('Should use correct GOV.UK Design System classes', () => {
      expectGovukFrontendClasses(document)
    })
  })

  describe('All Error Pages - Common Requirements', () => {
    const testRoutes = [
      { url: '/this-does-not-exist-404', description: '404 Not Found' },
      { url: '/test-error-403', description: '403 Forbidden' },
      { url: '/test-error-500', description: '500 Server Error' },
      { url: '/test-error-503', description: '503 Service Unavailable' }
    ]

    test.each(testRoutes)(
      'Should have proper HTML structure - $description',
      async ({ url }) => {
        const { result } = await makeGetRequest({
          server: getServer(),
          url
        })

        const document = new JSDOM(result).window.document

        // Should extend from page layout
        expect(document.querySelector('.app-main-wrapper')).toBeInTheDocument()
        expect(document.querySelector('.govuk-grid-row')).toBeInTheDocument()
        expect(
          document.querySelector('.govuk-grid-column-two-thirds')
        ).toBeInTheDocument()
      }
    )

    test.each(testRoutes)(
      'Should have page layout components - $description',
      async ({ url }) => {
        const { result } = await makeGetRequest({
          server: getServer(),
          url
        })
        const document = new JSDOM(result).window.document

        const header = document.querySelector('.govuk-header')
        expect(header).toBeInTheDocument()

        const footer = document.querySelector('.govuk-footer')
        expect(footer).toBeInTheDocument()
      }
    )
  })

  describe('Contact Details Component Integration', () => {
    const errorPagesWithContactDetails = [
      { url: '/this-does-not-exist-404', description: '404 page' },
      { url: '/test-error-500', description: '500 page' },
      { url: '/test-error-503', description: '503 page' }
    ]

    test.each(errorPagesWithContactDetails)(
      'Should include contact details in $description',
      async ({ url }) => {
        const { result } = await makeGetRequest({
          server: getServer(),
          url
        })

        const document = new JSDOM(result).window.document

        expectContactDetailsSection(document)
      }
    )
  })
})
