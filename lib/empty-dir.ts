import { existsSync, rmdirSync, unlinkSync } from 'node:fs'
import { postOrderDirectoryTraverse } from './post-order-directory-traverse'

export function emptyDir(dir: string) {
  if (!existsSync(dir)) {
    return
  }

  postOrderDirectoryTraverse(
    dir,
    (dir) => rmdirSync(dir),
    (file) => unlinkSync(file),
  )
}
