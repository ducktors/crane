import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

import { render } from './render'
import { renderPackageJson } from './package-json'

export async function renderApp(
  templateRoot: string,
  packageName: string | undefined,
  destFolder: string,
  projectType: 'app' | 'monorepo-app',
  existingProject: 'force' | 'inject' | 'skip',
) {
  if (existingProject !== 'inject' && packageName !== undefined) {
    renderPackageJson(packageName, destFolder)
  }
  render(templateRoot, 'base', destFolder, existingProject)
  render(templateRoot, 'app', destFolder, existingProject)
  if (projectType === 'monorepo-app') {
    // remove destFolder/rome.json
    await unlink(join(destFolder, 'rome.json'))
  }
}
