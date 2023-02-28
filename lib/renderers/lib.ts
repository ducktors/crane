import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

import { render } from './render'
import { renderPackageJson } from './package-json'

export async function renderLib(
  templateRoot: string,
  packageName: string,
  destFolder: string,
  projectType: 'lib' | 'monorepo-lib',
) {
  renderPackageJson(packageName, destFolder)
  render(templateRoot, 'base', destFolder)
  render(templateRoot, 'lib', destFolder)
  if (projectType === 'monorepo-lib') {
    // remove destFolder/rome.json
    await unlink(join(destFolder, 'rome.json'))
  }
}
