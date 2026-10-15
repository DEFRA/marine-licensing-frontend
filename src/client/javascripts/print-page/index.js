export class PrintPage {
  constructor($module) {
    if (!$module) {
      return
    }
    $module.hidden = false
    $module.addEventListener('click', (event) => {
      event.preventDefault()
      globalThis.print()
    })
  }
}
