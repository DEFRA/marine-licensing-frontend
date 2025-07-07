import { formatDate } from '~/src/config/nunjucks/filters/format-date.js'

export const formatProjectsForDisplay = (projects) =>
  projects.map((project) => {
    const tagClass =
      project.status === 'Draft' ? 'govuk-tag--blue' : 'govuk-tag--green'

    return [
      { text: project.projectName },
      { text: project.type },
      { text: project.applicationReference || '-' },
      {
        html: `<strong class="govuk-tag ${tagClass}">${project.status}</strong>`
      },
      {
        text: project.submittedAt
          ? formatDate(project.submittedAt, 'dd MMM yyyy')
          : '-'
      }
    ]
  })
