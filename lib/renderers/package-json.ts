import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function renderPackageJson(packageName: string, destFolder: string) {
  const pkg = { name: packageName, version: '0.0.0' }
  writeFileSync(
    resolve(destFolder, 'package.json'),
    JSON.stringify(pkg, null, 2),
  )
}
