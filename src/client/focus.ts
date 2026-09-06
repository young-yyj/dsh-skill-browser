const FOCUSABLE = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function focusableElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)]
    .filter(element => {
      if (element.closest('[hidden], [aria-hidden="true"]')) return false
      for (let ancestor = element.parentElement; ancestor && root.contains(ancestor); ancestor = ancestor.parentElement) {
        if (ancestor instanceof HTMLDetailsElement && !ancestor.open) {
          const summary = ancestor.querySelector(':scope > summary')
          if (!summary?.contains(element)) return false
        }
      }
      return true
    })
}
export function trapTab(event: KeyboardEvent, root: HTMLElement): void {
  if (event.key !== 'Tab') return
  const elements = focusableElements(root)
  if (elements.length === 0) {
    event.preventDefault()
    root.focus()
    return
  }
  const first = elements[0]!
  const last = elements[elements.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
