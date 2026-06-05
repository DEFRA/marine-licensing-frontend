import { getByRole, getByText } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'

export function sharedWaterDirectiveBeforeYouStartTests({
  request,
  projectName,
  navLinks
}) {
  test('should display the correct content', async () => {
    const { result, statusCode } = await request()

    expect(statusCode).toBe(statusCodes.ok)

    const { document } = new JSDOM(result).window

    expect(
      getByRole(document, 'heading', { name: 'Water Framework Directive' })
    ).toBeInTheDocument()
    expect(getByText(document, projectName)).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Before you start' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Excluded activities' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Previous WFD assessment' })
    ).toBeInTheDocument()
    expect(
      getByRole(document, 'heading', { name: 'Uploading your assessment' })
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        "The Water Framework Directive (WFD) protects the quality of estuarine and coastal waters. Its aim is to make sure all water bodies reach or maintain 'good' status."
      )
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        'if your project is within one nautical mile (1.85km) of the coast'
      )
    ).toBeInTheDocument()

    expect(
      getByText(document, 'Help with excluded activities')
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        'You may not need to complete a new WFD assessment if you carried out the same activity at the same location, between 2015 and 2022 and already have an assessment.'
      )
    ).toBeInTheDocument()

    expect(
      getByText(
        document,
        'You will need to upload a WFD assessment as part of your application if:'
      )
    ).toBeInTheDocument()
  })

  test('should have correct navigation links', async () => {
    const { result } = await request()

    const { document } = new JSDOM(result).window

    const continueButton = getByRole(document, 'button', { name: 'Continue' })
    expect(continueButton).toHaveAttribute('href', navLinks.continueHref)

    const backLink = getByRole(document, 'link', { name: 'Back' })
    expect(backLink).toHaveAttribute('href', navLinks.backHref)
  })
}
