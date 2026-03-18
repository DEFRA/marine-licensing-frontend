import { formatDate } from '#src/config/nunjucks/filters/format-date.js'

export const formatProjectsForDisplay = (projects, csrfToken) =>
  projects.map((project) => [
    { text: project.projectName },
    { text: project.applicationReference },
    {
      text: formatDate(project.submittedAt, 'd MMM yyyy')
    },
    {
      html: `<form method="POST">
        <input type="hidden" name="csrfToken" value="${csrfToken}">
        <input type="hidden" name="exemptionId" value="${project._id}">
        <button type="submit" class="govuk-button govuk-button--secondary" data-module="govuk-button">
          Backfill and submit
        </button>
      </form>`
    }
  ])
