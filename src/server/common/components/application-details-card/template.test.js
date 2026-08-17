import { renderComponentJSDOM } from '#src/server/test-helpers/component-helpers.js'
import { validateApplicationDetails } from '#tests/integration/shared/summary-card-validators.js'
import { within } from '@testing-library/dom'

describe('Application Details Card Component', () => {
  test('should display all card content', () => {
    const card = renderComponentJSDOM('application-details-card', {
      applicationReference: 'EXE/2025/10121',
      dateSubmitted: '2025-09-18T08:56:34.000Z',
      whoExemptionIsFor: 'Test Organisation'
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

  test('should display the status tag and date withdrawn for a withdrawn exemption', () => {
    const card = renderComponentJSDOM('application-details-card', {
      applicationReference: 'EXE/2025/10121',
      dateSubmitted: '2025-09-18T08:56:34.000Z',
      whoExemptionIsFor: 'Test Organisation',
      status: 'Withdrawn',
      statusTagClass: 'govuk-tag--grey',
      withdrawnAt: '2025-10-02T08:56:34.000Z'
    })

    validateApplicationDetails(card, {
      applicationDetails: {
        Status: 'Withdrawn',
        'Date withdrawn': '2 October 2025'
      }
    })
    expect(within(card).getByText('Withdrawn')).toHaveClass('govuk-tag--grey')
  })

  test('should not display date withdrawn for an active exemption', () => {
    const card = renderComponentJSDOM('application-details-card', {
      applicationReference: 'EXE/2025/10121',
      dateSubmitted: '2025-09-18T08:56:34.000Z',
      whoExemptionIsFor: 'Test Organisation',
      status: 'Active',
      statusTagClass: 'govuk-tag--green'
    })

    validateApplicationDetails(card, {
      applicationDetails: { Status: 'Active' }
    })
    expect(within(card).queryByText('Date withdrawn')).not.toBeInTheDocument()
  })

  test('should not display who the exemption is for if it is not provided', () => {
    const card = renderComponentJSDOM('application-details-card', {
      applicationReference: 'EXE/2025/10121',
      dateSubmitted: '2025-09-18T08:56:34.000Z'
    })
    expect(
      within(card).queryByText('Who the exemption is for')
    ).not.toBeInTheDocument()
  })
})
