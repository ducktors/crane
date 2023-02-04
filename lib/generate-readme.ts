// extracted from https://github.com/vuejs/create-vue/blob/main/utils/generateReadme.ts
import { getCommand } from './get-command'

export default function generateReadme({
  projectName,
  packageManager,
  projectType,
}: { projectName: string; packageManager: string; projectType: string }) {
  const commandFor = (scriptName: string, args?: string) =>
    getCommand(packageManager, scriptName, args)

  let readme = `# ${projectName}

## Project Setup

`

  let npmScriptsDescriptions = `\`\`\`sh
${commandFor('install')}
\`\`\`

### Type-Check Compile and Minify for Production

\`\`\`sh
${commandFor('build')}
\`\`\`
`
  if (projectType === 'app') {
    npmScriptsDescriptions += `
### Compile and Hot-Reload for Development

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
### Lint with [Rome](https://rome.tools/)

\`\`\`sh
${commandFor('lint')}
\`\`\`
`

  readme += npmScriptsDescriptions

  return readme
}
