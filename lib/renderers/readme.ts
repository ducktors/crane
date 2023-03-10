import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import generateReadme from '../generate-readme'

export function renderReadme(
  projectName: string,
  projectType: string,
  destFolder: string,
  existingProject: 'force' | 'inject' | 'skip',
) {
  if (existingProject !== 'inject') {
    writeFileSync(
      resolve(destFolder, 'README.md'),
      generateReadme({
        projectName,
        projectType,
      }),
    )
  }
}
