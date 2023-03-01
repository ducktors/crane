import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

import { render } from './render'
import { renderPackageJson } from './package-json'

export async function renderLib(
  templateRoot: string,
  packageName: string | undefined,
  destFolder: string,
  projectType: 'lib' | 'monorepo-lib',
  existingProject: 'force' | 'inject' | 'skip',
) {
  if (existingProject !== 'inject' && packageName !== undefined) {
    renderPackageJson(packageName, destFolder)
  }
  render(templateRoot, 'base', destFolder, existingProject)
  render(templateRoot, 'lib', destFolder, existingProject)
  if (projectType === 'monorepo-lib') {
    // remove destFolder/rome.json
    await unlink(join(destFolder, 'rome.json'))
  }
}
