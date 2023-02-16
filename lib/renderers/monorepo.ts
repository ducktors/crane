import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from './render'
import { renderApp } from './app'
import { renderLib } from './lib'

export function renderMonorepo(
  templateRoot: string,
  packageName: string,
  destFolder: string,
) {
  render(templateRoot, 'monorepo', destFolder)

  const packageAppName = `${packageName}-app`
  const appFolder = resolve(destFolder, 'apps', packageAppName)
  mkdirSync(appFolder, { recursive: true })
  renderApp(templateRoot, packageAppName, appFolder)

  const packageLibName = `${packageName}-package`
  const packageFolder = resolve(destFolder, 'packages', packageLibName)
  mkdirSync(packageFolder, { recursive: true })
  renderLib(templateRoot, packageLibName, packageFolder)
}
