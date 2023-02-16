import { render } from './render'

type RepositoryType = 'standalone' | 'monorepo'

export function renderWithActions(
  templateRoot: string,
  destFolder: string,
  repositoryType: RepositoryType,
) {
  render(templateRoot, `with-actions/${repositoryType}`, destFolder)
}
