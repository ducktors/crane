import { render } from './render'

export function renderWithChangesets(templateRoot: string, destFolder: string) {
  render(templateRoot, 'with-changesets', destFolder)
}
