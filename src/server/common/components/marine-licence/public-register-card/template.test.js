import { renderComponentJSDOM } from '#src/server/test-helpers/component-helpers.js'
import { within } from '@testing-library/dom'
import { validatePublicRegister } from '#tests/integration/shared/summary-card-validators.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { buildPublicRegisterRows } from '#src/server/common/helpers/marine-licence/public-register-rows.js'

const COMPONENT = 'marine-licence/public-register-card'
const CARD_TITLE = 'Information published on the public register'
const WITHHOLD_QUESTION =
  'Do you want to ask us to withhold any information from the public register?'
const APPROVAL_QUESTION =
  'Do you have approval from the Secretary of State for Defence to withhold information for national security reasons?'
const CHANGE_LINK = `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER_CHECK_ANSWERS}?from=check-your-answers`

const renderCard = (publicRegister, params = {}) =>
  renderComponentJSDOM(COMPONENT, {
    rows: buildPublicRegisterRows(publicRegister),
    isReadOnly: true,
    ...params
  })

describe('Marine Licence Public Register Card Component', () => {
  describe('Card title and change link', () => {
    test('has the card title', () => {
      const component = renderCard({ withholdConsent: 'no' })
      expect(
        within(component).getByRole('heading', { level: 2 })
      ).toHaveTextContent(CARD_TITLE)
    })

    test('does not show a change link when read-only', () => {
      const component = renderCard({ withholdConsent: 'no' })
      expect(
        within(component).queryByRole('link', { name: /Change/ })
      ).not.toBeInTheDocument()
    })

    test('shows a card-level change link to the given href when not read-only', () => {
      const component = renderCard(
        { withholdConsent: 'no' },
        { isReadOnly: false, changeLink: CHANGE_LINK }
      )
      const link = within(component).getByRole('link', { name: /Change/ })
      expect(link).toHaveAttribute('href', CHANGE_LINK)
      expect(link).toHaveTextContent(
        'Change information published on the public register'
      )
      expect(
        component.querySelectorAll('.govuk-summary-list__actions')
      ).toHaveLength(0)
    })
  })

  test('shows "No"', () => {
    validatePublicRegister(renderCard({ withholdConsent: 'no' }), {
      publicRegister: { [WITHHOLD_QUESTION]: 'No' }
    })
  })

  test('shows commercial confidentiality answers', () => {
    validatePublicRegister(
      renderCard({
        withholdConsent: 'yes',
        withholdReason: 'commercialConfidentiality',
        reason: 'Trestle method'
      }),
      {
        publicRegister: {
          [WITHHOLD_QUESTION]:
            'Yes – Commercial or industrial confidentiality reasons',
          'What you want withheld and why': 'Trestle method'
        }
      }
    )
  })

  test('shows national security answers with no border under the approval row', () => {
    const component = renderCard({
      withholdConsent: 'yes',
      withholdReason: 'nationalSecurity',
      nationalSecurityApproval: 'yes',
      reason: 'Radar sites'
    })

    validatePublicRegister(component, {
      publicRegister: {
        [WITHHOLD_QUESTION]: 'Yes – National security reasons',
        [APPROVAL_QUESTION]: 'Yes',
        'What you want withheld': 'Radar sites'
      }
    })
    const rows = component.querySelectorAll('.govuk-summary-list__row')
    expect(rows[0]).not.toHaveClass('govuk-summary-list__row--no-border')
    expect(rows[1]).toHaveClass('govuk-summary-list__row--no-border')
  })

  test('renders line breaks in user text without rendering its HTML', () => {
    const component = renderCard({
      withholdConsent: 'yes',
      withholdReason: 'commercialConfidentiality',
      reason: '<b>bold</b>\nSecond line'
    })
    const value = component.querySelectorAll('.govuk-summary-list__value')[1]

    expect(value.querySelector('b')).toBeNull()
    expect(value.querySelectorAll('br')).toHaveLength(1)
    expect(value).toHaveTextContent('<b>bold</b>Second line')
  })

  test('shows the withhold row as incomplete when unanswered', () => {
    validatePublicRegister(renderCard(undefined), {
      publicRegister: { [WITHHOLD_QUESTION]: 'Incomplete' }
    })
  })
})
