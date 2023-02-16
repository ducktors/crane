// taken from https://github.com/vuejs/create-vue/blob/main/utils/renderTemaplate.ts
import {
  statSync,
  mkdirSync,
  readdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs'
import { basename, resolve, dirname } from 'node:path'

import { deepMerge } from '../deep-merge'
import { sortProperties } from '../sort-properties'

function renderTemplate(src: string, dest: string) {
  const stats = statSync(src)

  if (stats.isDirectory()) {
    // skip node_module
    if (basename(src) === 'node_modules') {
      return
    }

    // if it's a directory, render its subdirectories and files recursively
    mkdirSync(dest, { recursive: true })
    for (const file of readdirSync(src)) {
      renderTemplate(resolve(src, file), resolve(dest, file))
    }
    return
  }

  const filename = basename(src)

  if (filename === 'package.json' && existsSync(dest)) {
    // merge instead of overwriting
    const existing = JSON.parse(readFileSync(dest, 'utf8'))
    const newPackage = JSON.parse(readFileSync(src, 'utf8'))
    const pkg = sortProperties(deepMerge(existing, newPackage))
    writeFileSync(dest, JSON.stringify(pkg, null, 2) + '\n')
    return
  }

  if (filename.startsWith('_')) {
    // rename `_file` to `.file`
    dest = resolve(dirname(dest), filename.replace(/^_/, '.'))
  }

  if (filename === '_gitignore' && existsSync(dest)) {
    // append to existing .gitignore
    const existing = readFileSync(dest, 'utf8')
    const newGitignore = readFileSync(src, 'utf8')
    writeFileSync(dest, existing + '\n' + newGitignore)
    return
  }

  copyFileSync(src, dest)
}

export default renderTemplate
