import { render } from './render'

export function renderWithCommitlint(templateRoot: string, destFolder: string) {
  render(templateRoot, 'with-commitlint', destFolder)
}
