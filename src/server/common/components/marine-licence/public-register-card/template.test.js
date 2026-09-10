import { renderComponentJSDOM } from '#src/server/test-helpers/component-helpers.js'
import { within } from '@testing-library/dom'
import { validatePublicRegister } from '#tests/integration/shared/summary-card-validators.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

const COMPONENT = 'marine-licence/public-register-card'
const CARD_TITLE = 'Sharing your application information publicly'
const DETAILS_KEY = 'Details of information to be withheld and why'

describe('Marine Licence Public Register Card Component', () => {
  describe('When no information is withheld', () => {
    const renderComponent = (params) =>
      renderComponentJSDOM(COMPONENT, {
        publicRegister: { consent: 'no' },
        isReadOnly: true,
        ...params
      })

    test('Should have correct card title', () => {
      const component = renderComponent()
      expect(
        within(component).getByRole('heading', { level: 2 })
      ).toHaveTextContent(CARD_TITLE)
    })

    test('Should display "No" for the withhold request', () => {
      const component = renderComponent()
      validatePublicRegister(component, {
        publicRegister: {
          'Request that information is withheld': 'No'
        }
      })
    })

    test('Should not display the details row', () => {
      const component = renderComponent()
      expect(within(component).queryByText(DETAILS_KEY)).not.toBeInTheDocument()
    })

    test('should not show a change link when read-only', () => {
      const component = renderComponent()
      expect(
        within(component).queryByRole('link', { name: /Change/ })
      ).not.toBeInTheDocument()
    })

    test('should show a change link when not read-only', () => {
      const component = renderComponent({
        isReadOnly: false,
        changeLink: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
      })
      expect(
        within(component).getByRole('link', { name: /Change/ })
      ).toHaveAttribute(
        'href',
        `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER}?from=check-your-answers`
      )
    })
  })

  describe('When the question has not been answered', () => {
    test('Should show the withhold request row as incomplete', () => {
      const component = renderComponentJSDOM(COMPONENT, {
        publicRegister: undefined,
        isReadOnly: true
      })
      validatePublicRegister(component, {
        publicRegister: {
          'Request that information is withheld': 'Incomplete'
        }
      })
    })
  })

  describe('When information is withheld', () => {
    const renderComponent = (params) =>
      renderComponentJSDOM(COMPONENT, {
        publicRegister: {
          consent: 'yes',
          reason: 'Commercial sensitivity - contains proprietary information'
        },
        isReadOnly: true,
        ...params
      })

    test('Should have correct card title', () => {
      const component = renderComponent()
      expect(
        within(component).getByRole('heading', { level: 2 })
      ).toHaveTextContent(CARD_TITLE)
    })

    test('Should display "Yes" for the withhold request, and the details', () => {
      const component = renderComponent()
      validatePublicRegister(component, {
        publicRegister: {
          'Request that information is withheld': 'Yes',
          [DETAILS_KEY]:
            'Commercial sensitivity - contains proprietary information'
        }
      })
    })

    test('should show nothing in the details field if none was provided', () => {
      const component = renderComponent({ publicRegister: { consent: 'yes' } })
      validatePublicRegister(component, {
        publicRegister: {
          'Request that information is withheld': 'Yes',
          [DETAILS_KEY]: ''
        }
      })
    })

    test('should show a change link when not read-only', () => {
      const component = renderComponent({
        isReadOnly: false,
        changeLink: marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER
      })
      expect(
        within(component).getByRole('link', { name: /Change/ })
      ).toHaveAttribute(
        'href',
        `${marineLicenceRoutes.MARINE_LICENCE_PUBLIC_REGISTER}?from=check-your-answers`
      )
    })
  })
})
