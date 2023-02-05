import { lstatSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

export function postOrderDirectoryTraverse(
  dir: string,
  dirCallback: (dir: string) => void,
  fileCallback: (file: string) => void,
) {
  for (const filename of readdirSync(dir)) {
    if (filename === '.git') {
      continue
    }
    const fullpath = resolve(dir, filename)
    if (lstatSync(fullpath).isDirectory()) {
      postOrderDirectoryTraverse(fullpath, dirCallback, fileCallback)
      dirCallback(fullpath)
      continue
    }
    fileCallback(fullpath)
  }
}
