import { render } from './render'
import { renderPackageJson } from './package-json'

export async function renderLib(
  templateRoot: string,
  packageName: string | undefined,
  destFolder: string,
  existingProject: 'force' | 'inject' | 'skip',
) {
  if (existingProject !== 'inject' && packageName !== undefined) {
    renderPackageJson(packageName, destFolder)
  }
  render(templateRoot, 'base', destFolder, existingProject)
  render(templateRoot, 'lib', destFolder, existingProject)
}
