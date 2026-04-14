import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'

describe('Project background', () => {
  const getServer = setupTestServer()
  const marineLicence = {
    id: 'marine-licence-123',
    projectName: 'Test Marine Project'
  }

  const submitProjectBackgroundForm = async (formData) => {
    const { document } = await submitForm({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
      server: getServer(),
      formData
    })
    return document
  }

  test('page elements', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
      server: getServer()
    })

    expect(getByText(document, 'Test Marine Project')).toBeInTheDocument()
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Project background'
    )
    getByRole(document, 'button', { name: 'Save and continue' })
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )
  })

  test('back link from Check Your Answers', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND +
        '?from=check-your-answers',
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
    )
  })

  test('project background form state when no data set', async () => {
    mockMarineLicence(marineLicence)

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
      server: getServer()
    })

    expect(getByRole(document, 'textbox')).toHaveValue('')
  })

  test('project background form state when data is set', async () => {
    mockMarineLicence({
      ...marineLicence,
      projectBackground: 'Some background text'
    })

    const document = await loadPage({
      requestUrl: marineLicenceRoutes.MARINE_LICENCE_PROJECT_BACKGROUND,
      server: getServer()
    })

    expect(getByRole(document, 'textbox')).toHaveValue('Some background text')
  })

  test('should show a validation error when submitted without content', async () => {
    mockMarineLicence(marineLicence)

    const document = await submitProjectBackgroundForm({
      projectBackground: ''
    })

    validateErrors(
      [
        {
          field: 'projectBackground',
          message: 'Enter the project background'
        }
      ],
      document
    )
  })

  test('should show a validation error when content exceeds 1000 characters', async () => {
    mockMarineLicence(marineLicence)

    const document = await submitProjectBackgroundForm({
      projectBackground: 'a'.repeat(1001)
    })

    validateErrors(
      [
        {
          field: 'projectBackground',
          message: 'Project background must be 1000 characters or less'
        }
      ],
      document
    )
  })
})
