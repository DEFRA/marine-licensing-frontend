import { getByRole } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import {
  mockRedactedMarineLicenceApplication,
  mockSubmittedMarineLicenceApplication
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  expectedExternalActivityCards,
  expectedWaterFrameworkDirectiveCard
} from './fixtures.js'
import { toApplicationReferenceUrlSegment } from '~/src/server/common/helpers/marine-licence/application-reference-url-segment.js'
import { getAuthProvider } from '~/src/server/common/helpers/authenticated-requests.js'
import { AUTH_STRATEGIES } from '~/src/server/common/constants/auth.js'
import { validateWaterFrameworkDirective } from '#tests/integration/shared/summary-card-validators.js'

vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('Marine Licence View Details Redaction', () => {
  const getServer = setupTestServer()
  let document

  const loadViewDetailsPage = async (server) => {
    vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)

    mockMarineLicence(mockSubmittedMarineLicenceApplication)
    return loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${toApplicationReferenceUrlSegment(mockSubmittedMarineLicenceApplication.applicationReference)}`,
      server
    })
  }

  beforeEach(async () => {
    document = await loadViewDetailsPage(getServer())
  })

  test('renders the page in Dynamics view', async () => {
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Redact application for the public register'
    )

    expect(document.querySelector('.govuk-caption-l').textContent).toBe(
      `${mockSubmittedMarineLicenceApplication.applicationReference} - ${mockSubmittedMarineLicenceApplication.projectName}`
    )

    expect(document.querySelector('.app-redaction-label').textContent).toBe(
      '***REDACTED***'
    )
  })

  describe('applicant withhold reason', () => {
    test('does not show the withhold inset when the applicant consented to sharing', () => {
      expect(document.querySelector('#applicant-withhold-reason')).toBeNull()
    })

    test('shows the applicant reason when they asked to withhold information', async () => {
      const reason = 'Commercially sensitive working hours'

      vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
      mockMarineLicence({
        ...mockSubmittedMarineLicenceApplication,
        publicRegister: { withholdConsent: 'yes', reason }
      })

      const withheldDocument = await loadPage({
        requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${toApplicationReferenceUrlSegment(mockSubmittedMarineLicenceApplication.applicationReference)}`,
        server: getServer()
      })

      const inset = withheldDocument.querySelector('#applicant-withhold-reason')

      expect(inset).not.toBeNull()
      expect(inset.textContent).toContain(
        'The information the applicant wants withheld and why'
      )
      expect(inset.textContent).toContain(reason)
    })
  })

  describe('redaction field', () => {
    const referenceUrl = toApplicationReferenceUrlSegment(
      mockSubmittedMarineLicenceApplication.applicationReference
    )
    const viewUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${referenceUrl}`
    const redactUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${referenceUrl}/redact`
    const applicantText = 'July 2026 to August 2027'
    const redactedText = 'Redacted preferred dates'

    test.each([
      ['projectName', mockSubmittedMarineLicenceApplication.projectName],
      [
        'projectBackground',
        mockSubmittedMarineLicenceApplication.projectBackground
      ],
      ['preferredDates', 'July 2026 to August 2027']
    ])('renders a redaction field for %s', (fieldId, text) => {
      const $field = document.querySelector(`#redaction-field-${fieldId}`)

      expect($field).not.toBeNull()
      expect($field.querySelector('input[name="fieldKey"]').value).toBe(fieldId)
      expect($field.querySelector('.app-redaction-field__input').value).toBe(
        text
      )
    })

    test.each(['specialLegalPowers', 'harbourAuthority', 'publicConsultation'])(
      'renders a redaction field for %s',
      (groupName) => {
        const $field = document.querySelector(`#redaction-field-${groupName}`)

        expect($field).not.toBeNull()
        expect($field.querySelector('input[name="fieldKey"]').value).toBe(
          `${groupName}`
        )
      }
    )

    test.each([
      'activitySubType',
      'activities',
      'activityDescription',
      'activityDuration',
      'completionDate',
      'activityMonths',
      'workingHours'
    ])('renders a redaction field for activity %s', (field) => {
      const $field = document.querySelector(`#redaction-field-${field}-0-0`)

      expect($field).not.toBeNull()
      expect($field.querySelector('input[name="fieldKey"]').value).toBe(
        `siteDetails.activityDetails.${field}`
      )
      expect($field.querySelector('input[name="index"]').value).toBe('0')
      expect($field.querySelector('input[name="activityIndex"]').value).toBe(
        '0'
      )
    })

    test('numbers activity redaction fields by site and activity', () => {
      const $second = document.querySelector(
        '#redaction-field-workingHours-0-1'
      )

      expect($second).not.toBeNull()
      expect($second.querySelector('input[name="index"]').value).toBe('0')
      expect($second.querySelector('input[name="activityIndex"]').value).toBe(
        '1'
      )
    })

    test('renders a redaction field for each site name', () => {
      const siteCount = mockSubmittedMarineLicenceApplication.siteDetails.length

      for (let index = 0; index < siteCount; index++) {
        const $field = document.querySelector(
          `#redaction-field-siteName-${index}`
        )

        expect($field).not.toBeNull()
        expect($field.querySelector('input[name="fieldKey"]').value).toBe(
          'siteDetails.siteName'
        )
        expect($field.querySelector('input[name="index"]').value).toBe(
          String(index)
        )
      }
    })

    describe('when the field has not been redacted', () => {
      test('offers to redact the applicant text', () => {
        expect(
          document.querySelector('#redaction-field-preferredDates')
        ).not.toBeNull()

        const triggerText = document.querySelector(
          '#redaction-field-preferredDates .app-redaction-field__trigger'
        ).textContent

        expect(triggerText).toContain('Redact')
        expect(triggerText).not.toContain('Change')
      })

      test('prepopulates the form with the applicant text', () => {
        expect(
          document.querySelector(
            '#redaction-field-preferredDates .app-redaction-field__input'
          ).value
        ).toBe(applicantText)

        expect(
          document.querySelector(
            '#redaction-field-preferredDates input[name="fieldKey"]'
          ).value
        ).toBe('preferredDates')

        expect(
          document
            .querySelector(
              '#redaction-field-preferredDates .app-redaction-field__form'
            )
            .getAttribute('action')
        ).toBe(redactUrl)
      })
    })

    test('shows the existing redaction when the field has been redacted', async () => {
      vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
      mockMarineLicence(mockRedactedMarineLicenceApplication)

      const redactedDocument = await loadPage({
        requestUrl: viewUrl,
        server: getServer()
      })

      expect(
        redactedDocument.querySelector(
          '#redaction-field-preferredDates .app-redaction-field__trigger'
        ).textContent
      ).toContain('Change redaction')

      expect(
        redactedDocument.querySelector(
          '#redaction-field-preferredDates .app-redaction-field__remove-trigger'
        ).textContent
      ).toContain('Remove redaction')

      const summary = redactedDocument.querySelector(
        '#redaction-field-preferredDates .app-redaction-field__published-text'
      ).textContent

      expect(summary).toContain(applicantText)
      expect(summary).toContain(redactedText)

      expect(
        redactedDocument.querySelector(
          '#redaction-field-preferredDates .app-redaction-field__input'
        ).value
      ).toBe(redactedText)
    })
  })

  describe('site details', () => {
    test('renders the site location card', () => {
      expect(document.querySelector('#site-location-card')).not.toBeNull()
    })

    test('renders a site card for each site', () => {
      const siteCount = mockSubmittedMarineLicenceApplication.siteDetails.length
      for (let i = 1; i <= siteCount; i++) {
        expect(document.querySelector(`#site-details-${i}`)).not.toBeNull()
      }
    })

    test('does not render the internal-user-only site-details-card', () => {
      expect(document.querySelector('#site-details-card')).toBeNull()
    })

    test('offers to withhold the location of a site that is on show', () => {
      const $button = document.querySelector(
        '#site-details-1 .app-withhold__button'
      )

      expect($button.textContent).toContain('Withhold location')
      expect(
        document.querySelector('#site-details-1 .app-site-details-map')
      ).not.toBeNull()
    })

    test('offers to display the location of a withheld site', async () => {
      vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
      mockMarineLicence({
        ...mockSubmittedMarineLicenceApplication,
        redactions: {
          siteDetails: { 0: { withholdLocation: { withhold: true } } }
        }
      })

      const withheldDocument = await loadPage({
        requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${toApplicationReferenceUrlSegment(mockSubmittedMarineLicenceApplication.applicationReference)}`,
        server: getServer()
      })

      const $container = withheldDocument.querySelector(
        '#site-details-1 .app-withhold-location__form'
      )

      const $button = withheldDocument.querySelector(
        '#site-details-1 .app-withhold__button'
      )

      expect($container.textContent).toContain(
        'This location will not be published on the public register.'
      )
      expect($button.textContent).toContain('Display location')
      expect($button.textContent).not.toContain('Withhold location')
      expect(
        withheldDocument.querySelector('#site-details-1 .app-site-details-map')
      ).toBeNull()
    })
  })

  describe('construction drawing cards', () => {
    const referenceUrl = toApplicationReferenceUrlSegment(
      mockSubmittedMarineLicenceApplication.applicationReference
    )
    const viewUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS_INTERNAL_USER}/${referenceUrl}`
    const redactUrl = `${viewUrl}/redact`

    const loadWithDrawings = async (redactions) => {
      vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
      mockMarineLicence({
        ...mockSubmittedMarineLicenceApplication,
        siteDetails: mockSubmittedMarineLicenceApplication.siteDetails.map(
          (site) => ({
            ...site,
            constructionDrawings: [
              { filename: 'drawing-one.pdf' },
              { filename: 'drawing-two.pdf' }
            ]
          })
        ),
        redactions
      })

      return loadPage({ requestUrl: viewUrl, server: getServer() })
    }

    test('renders no card when the site has no construction drawings', () => {
      expect(
        document.querySelector('#construction-drawing-site-1-1')
      ).toBeNull()
    })

    test('renders a card per drawing, offering to withhold each one', async () => {
      const drawingsDocument = await loadWithDrawings()

      const $card = drawingsDocument.querySelector(
        '#construction-drawing-site-1-2'
      )
      const $form = $card.querySelector('.app-withhold-location__form')

      expect($card.textContent).toContain('drawing-two.pdf')
      expect($form.getAttribute('action')).toBe(redactUrl)
      expect($form.querySelector('input[name="fieldKey"]').value).toBe(
        'siteDetails.constructionDrawings.withholdDocument'
      )
      expect($form.querySelector('input[name="index"]').value).toBe('0')
      expect($form.querySelector('input[name="drawingIndex"]').value).toBe('1')
      expect($form.querySelector('input[name="withhold"]').value).toBe('true')
      expect(
        $card.querySelector('.app-withhold__button').textContent
      ).toContain('Withhold document')
    })

    test('offers to remove the redaction on a withheld drawing only', async () => {
      const withheldDocument = await loadWithDrawings({
        siteDetails: {
          0: {
            constructionDrawings: {
              0: { withholdDocument: { withhold: true } }
            }
          }
        }
      })

      const $withheld = withheldDocument.querySelector(
        '#construction-drawing-site-1-1'
      )

      expect($withheld.textContent).not.toContain('drawing-one.pdf')
      expect($withheld.textContent).toContain(
        'This document will not be published on the public register.'
      )
      expect(
        $withheld.querySelector('.app-withhold__button').textContent
      ).toContain('Remove redaction')
      expect($withheld.querySelector('input[name="withhold"]').value).toBe(
        'false'
      )

      const $onShow = withheldDocument.querySelector(
        '#construction-drawing-site-1-2'
      )

      expect($onShow.textContent).toContain('drawing-two.pdf')
      expect(
        $onShow.querySelector('.app-withhold__button').textContent
      ).toContain('Withhold document')
    })
  })

  describe('hidden cards', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('does not render the fee estimate card', () => {
      expect(document.querySelector('#fee-estimate-card')).toBeNull()
    })

    test('does not render the invoicing card', () => {
      expect(document.querySelector('#invoicing-card')).toBeNull()
    })

    test('does not render the public register card', () => {
      expect(document.querySelector('#public-register-card')).toBeNull()
    })
  })

  describe('water framework directive card', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('renders the water framework directive card', () => {
      validateWaterFrameworkDirective(document, {
        waterFrameworkDirective: Object.fromEntries(
          Object.entries(
            expectedWaterFrameworkDirectiveCard.waterFrameworkDirective
          ).map(([heading, value]) => [heading, [value]])
        )
      })
    })

    test.each(['nauticalMile', 'excludedActivities'])(
      'renders a redaction field for %s',
      (fieldName) => {
        const $field = document.querySelector(
          `#redaction-field-waterFrameworkDirective-${fieldName}`
        )

        expect($field).not.toBeNull()
        expect($field.querySelector('input[name="fieldKey"]').value).toBe(
          `waterFrameworkDirective.${fieldName}`
        )
      }
    )

    test('does not render a Change link', () => {
      const card = document.querySelector('#water-framework-directive-card')
      const changeLink = card.querySelector('.govuk-summary-card__actions a')

      expect(changeLink).toBeNull()
    })
  })

  describe('marine plan policies card', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('renders the marine plan policies card with the correct title', () => {
      const card = document.querySelector('#marine-plan-policies-card')
      expect(card).not.toBeNull()
      expect(
        card.querySelector('.govuk-summary-card__title').textContent.trim()
      ).toBe('Marine plan policies')
    })

    test('renders the policy code, wording and consideration', () => {
      const card = document.querySelector('#marine-plan-policies-card')
      expect(card.textContent).toContain('S-CC-1')
      expect(card.textContent).toContain('First policy wording.')
      expect(card.textContent).toContain('My first consideration.')
      expect(card.textContent).toContain(`Applicant's consideration`)
    })

    test('renders a redaction field for the policy response', () => {
      const $field = document.querySelector(
        '#redaction-field-marinePlanPolicyResponse-S-CC-1'
      )

      expect($field).not.toBeNull()
      expect($field.querySelector('input[name="fieldKey"]').value).toBe(
        'marinePlanPolicyResponses'
      )
      expect($field.querySelector('input[name="policyCode"]').value).toBe(
        'S-CC-1'
      )
    })

    test('does not render a Change link for any row', () => {
      const card = document.querySelector('#marine-plan-policies-card')
      expect(
        card.querySelectorAll('.govuk-summary-list__actions a')
      ).toHaveLength(0)
      expect(card.querySelector('.govuk-summary-card__actions a')).toBeNull()
    })
  })

  describe('site activity details', () => {
    let document

    beforeEach(async () => {
      document = await loadViewDetailsPage(getServer())
    })

    test('renders a activity card for each site and activity', () => {
      const siteDetails = mockSubmittedMarineLicenceApplication.siteDetails

      let siteCount = 1
      for (const site of siteDetails) {
        const activityCount = site.activityDetails.length
        for (let a = 1; a <= activityCount; a++) {
          expect(
            document.querySelector(
              `#activity-details-site-${siteCount}-activity-${a}`
            )
          ).not.toBeNull()

          const card = document.querySelector(
            `#activity-details-site-${siteCount}-activity-${a}`
          )

          const rows = card.querySelectorAll('.govuk-summary-list__row')

          const activityIndex = a - 1

          expect(
            rows[0].querySelector('.govuk-summary-list__key').textContent.trim()
          ).toBe(expectedExternalActivityCards[activityIndex].rows[0].key)

          // the value now also carries the redaction field's own markup
          expect(
            rows[0]
              .querySelector('.govuk-summary-list__value')
              .textContent.trim()
          ).toContain(
            expectedExternalActivityCards[activityIndex].rows[0].value
          )

          expect(
            rows[1].querySelector('.govuk-summary-list__key').textContent.trim()
          ).toBe(expectedExternalActivityCards[activityIndex].rows[1].key)

          expect(
            rows[1]
              .querySelector('.govuk-summary-list__value')
              .textContent.trim()
          ).toContain(
            expectedExternalActivityCards[activityIndex].rows[1].value
          )
        }
        siteCount++
      }
    })
  })
})
