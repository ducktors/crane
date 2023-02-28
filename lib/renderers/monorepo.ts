import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { render } from './render'

export async function renderMonorepo(templateRoot: string, destFolder: string) {
  render(templateRoot, 'monorepo', destFolder)

  const appsFolder = resolve(destFolder, 'apps')
  mkdirSync(appsFolder, { recursive: true })

  const packagesFolder = resolve(destFolder, 'packages')
  mkdirSync(packagesFolder, { recursive: true })
}
