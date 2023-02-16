// extracted from https://github.com/vuejs/create-vue/blob/main/utils/generateReadme.ts
import { getCommand } from './get-command'

export default function generateReadme({
  projectName,
  projectType,
}: { projectName: string; projectType: string }) {
  const commandFor = (scriptName: string, args?: string) =>
    getCommand('pnpm', scriptName, args)

  let readme = `# ${projectName}

## Project Setup

`

  let npmScriptsDescriptions = `\`\`\`sh
${commandFor('install')}
\`\`\`

### Type-Check Compile for Production

\`\`\`sh
${commandFor('build')}
\`\`\`
`
  if (projectType === 'app') {
    npmScriptsDescriptions += `
### Hot-Reload for Development

\`\`\`sh
${commandFor('dev')}
\`\`\`
`
  }
  npmScriptsDescriptions += `
### Run Tests with [Vitest](https://vitest.dev/)

\`\`\`sh
${commandFor('test')}
\`\`\`
`

  npmScriptsDescriptions += `
### Lint and Format with [Rome](https://rome.tools/)

Linting will also check types using [tsc](https://www.typescriptlang.org/).

\`\`\`sh
${commandFor('lint')}
${commandFor('format')}
\`\`\`
`

  readme += npmScriptsDescriptions

  return readme
}
