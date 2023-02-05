import { render } from './render'
import { renderPackageJson } from './render-package-json'

export function renderLib(
  templateRoot: string,
  packageName: string,
  destFolder: string,
) {
  renderPackageJson(packageName, destFolder)
  render(templateRoot, 'base', destFolder)
  render(templateRoot, 'lib', destFolder)
}