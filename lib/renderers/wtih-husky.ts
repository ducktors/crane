import { render } from './render'

export function renderWithHusky(templateRoot: string, destFolder: string) {
  render(templateRoot, 'with-husky', destFolder)
}
