import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

import { render } from './render'
import { renderPackageJson } from './package-json'

export async function renderApp(
  templateRoot: string,
  packageName: string,
  destFolder: string,
  projectType: 'app' | 'monorepo-app',
) {
  renderPackageJson(packageName, destFolder)
  render(templateRoot, 'base', destFolder)
  render(templateRoot, 'app', destFolder)
  if (projectType === 'monorepo-app') {
    // remove destFolder/rome.json
    await unlink(join(destFolder, 'rome.json'))
  }
}
