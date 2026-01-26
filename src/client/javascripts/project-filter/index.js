export class ProjectFilter {
  constructor(element) {
    this.element = element
    this.form = element.closest('.app-filter-form')
    this.submitButton = this.form?.querySelector('.app-filter-submit')
    this.radios = element.querySelectorAll('input[type="radio"]')
    this.rows = document.querySelectorAll('.app-project-row')
    this.table = document.querySelector('#ex-projects-table')
    this.emptyMessage = document.querySelector('.app-empty-message')

    this.init()
  }

  init() {
    if (this.submitButton) {
      this.submitButton.classList.add('govuk-!-display-none')
    }

    for (const radio of this.radios) {
      radio.addEventListener('change', () => {
        this.filterProjects(radio.value)
      })
    }
  }

  filterProjects(filterValue) {
    let visibleCount = 0

    for (const row of this.rows) {
      const isOwnProject = row.dataset.isOwnProject === 'true'
      const shouldHide = filterValue === 'my-projects' && !isOwnProject
      row.classList.toggle('govuk-!-display-none', shouldHide)
      if (!shouldHide) {
        visibleCount++
      }
    }

    const hasVisibleRows = visibleCount > 0
    this.table?.classList.toggle('govuk-!-display-none', !hasVisibleRows)
    this.emptyMessage?.classList.toggle('govuk-!-display-none', hasVisibleRows)
  }
}
