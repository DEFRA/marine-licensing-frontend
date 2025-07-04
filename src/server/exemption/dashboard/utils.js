export const formatProjectsForDisplay = (projects) =>
  projects.map((project) => {
    const tagClass =
      project.status === 'Draft' ? 'govuk-tag--blue' : 'govuk-tag--red'

    return [
      { text: project.projectName },
      { text: project.type },
      { text: project.reference || '-' },
      {
        html: `<strong class="govuk-tag ${tagClass}">${project.status}</strong>`
      },
      { text: project.submittedAt || '-' }
    ]
  })
