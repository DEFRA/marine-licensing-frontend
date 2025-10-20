import { within } from '@testing-library/dom'

export const validateActionLink = (row, value, siteIndex) => {
  const actionList = row.querySelector('.govuk-summary-list__actions')
  expect(actionList).toBeTruthy()

  const hasValue = value && value !== '' && value !== 'Incomplete'
  const expectedText = hasValue ? /Change/i : /Add/i

  const actionLink = within(actionList).getByRole('link', {
    name: expectedText
  })

  const siteNumber = siteIndex + 1

  expect(actionLink).toHaveAttribute(
    'href',
    expect.stringContaining(
      `site=${siteNumber}&action=${hasValue ? 'change' : 'add'}`
    )
  )

  expect(actionLink.getAttribute('href')).toContain(
    `site=${siteNumber}&action=${hasValue ? 'change' : 'add'}`
  )
}
