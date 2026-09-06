/** @vitest-environment jsdom */
import { expect, it } from 'vitest'
import { focusableElements } from '../src/client/focus.ts'

it('includes disclosure summaries and excludes controls inside collapsed content', () => {
  const root = document.createElement('div')
  root.innerHTML = '<button>first</button><details><summary>more</summary><button>hidden</button></details>'
  expect(focusableElements(root).map(node => node.textContent)).toEqual(['first', 'more'])
  root.querySelector('details')!.open = true
  expect(focusableElements(root).map(node => node.textContent)).toEqual(['first', 'more', 'hidden'])
})
