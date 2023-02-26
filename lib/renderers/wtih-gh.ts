import { render } from './render'

type RepositoryType = 'standalone' | 'monorepo'

export function renderWithGH(
  templateRoot: string,
  destFolder: string,
  repositoryType: RepositoryType,
) {
  render(templateRoot, `with-gh/${repositoryType}`, destFolder)
}
