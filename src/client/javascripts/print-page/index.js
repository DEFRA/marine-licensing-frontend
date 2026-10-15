export class PrintPage {
  constructor($module) {
    if (!$module) {
      return
    }
    const $controls = $module.closest('[data-print-page-controls]') ?? $module
    $controls.hidden = false
    $module.addEventListener('click', (event) => {
      event.preventDefault()
      globalThis.print()
    })
  }
}
