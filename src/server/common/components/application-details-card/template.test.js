import { renderComponentJSDOM } from '#src/server/test-helpers/component-helpers.js'
import { validateApplicationDetails } from '#tests/integration/shared/summary-card-validators.js'
import { within } from '@testing-library/dom'

describe('Application Details Card Component', () => {
  test('should display all card content', () => {
    const card = renderComponentJSDOM('application-details-card', {
      applicationReference: 'EXE/2025/10121',
      dateSubmitted: '2025-09-18T08:56:34.000Z',
      whoExemptionIsFor: 'Test Organisation',
      isReadOnly: true
    })
    expect(within(card).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Application details'
    )
    validateApplicationDetails(card, {
      applicationDetails: {
        'Application type': 'Exempt activity notification',
        'Reference number': 'EXE/2025/10121',
        'Who the exemption is for': 'Test Organisation',
        'Date submitted': '18 September 2025'
      }
    })
  })

  test('should not display who the exemption is for if it is not provided', () => {
    const card = renderComponentJSDOM('application-details-card', {
      applicationReference: 'EXE/2025/10121',
      dateSubmitted: '2025-09-18T08:56:34.000Z',
      isReadOnly: true
    })
    expect(
      within(card).queryByText('Who the exemption is for')
    ).not.toBeInTheDocument()
  })
})
