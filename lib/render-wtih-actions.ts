import { render } from './render'

export function renderWithActions(templateRoot: string, destFolder: string) {
  render(templateRoot, 'with-actions', destFolder)
}
