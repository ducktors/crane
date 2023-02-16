import { render } from './render'
import { renderPackageJson } from './package-json'

export function renderApp(
  templateRoot: string,
  packageName: string,
  destFolder: string,
) {
  renderPackageJson(packageName, destFolder)
  render(templateRoot, 'base', destFolder)
  render(templateRoot, 'app', destFolder)
}
