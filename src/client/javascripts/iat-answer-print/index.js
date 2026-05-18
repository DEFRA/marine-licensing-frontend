export class IatAnswerPrint {
  constructor($module) {
    if (!$module) {
      return
    }
    $module.addEventListener('click', (event) => {
      event.preventDefault()
      globalThis.print()
    })
  }
}
