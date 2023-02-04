import {
  existsSync,
  readdirSync,
  mkdirSync,
  lstatSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { join, relative, resolve } from 'node:path'

import prompts from 'prompts'
import minimist from 'minimist'
import { red, yellow, bold, green } from 'kolorist'

import renderTemplate from './lib/render-template'
import generateReadme from './lib/generate-readme'
import { getCommand } from './lib/get-command'

function canSkipEmptying(dir: string) {
  if (!existsSync(dir)) {
    return true
  }

  const files = readdirSync(dir)
  if (files.length === 0) {
    return true
  }
  if (files.length === 1 && files[0] === '.git') {
    return true
  }

  return false
}

function postOrderDirectoryTraverse(
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

function emptyDir(dir: string) {
  if (!existsSync(dir)) {
    return
  }

  postOrderDirectoryTraverse(
    dir,
    (dir) => rmdirSync(dir),
    (file) => unlinkSync(file),
  )
}

// possible options:
// --lib
// --app
// --help
// --monorepo
// --force (for force overwriting)
const argv = minimist(process.argv.slice(2), {
  string: ['_'],
  boolean: true,
})

const cwd = process.cwd()
let projectDir = argv._[0]
const defaultProjectName = projectDir ?? 'my-project'

if (argv.app && argv.lib) {
  console.log(red('✖'), 'Cannot specify both --app and --lib')
  process.exit(1)
}

async function cli() {
  let result: {
    projectName?: string
    packageName?: string
    force?: boolean
    projectType?: 'app' | 'lib'
  } = {}
  try {
    result = await prompts(
      [
        {
          name: 'projectName',
          type: projectDir ? null : 'text',
          message: 'Project name:',
          initial: defaultProjectName,
          onState: (state) =>
            (projectDir = String(state.value).trim() || defaultProjectName),
        },
        {
          name: 'force',
          type: () =>
            canSkipEmptying(projectDir) || argv.force ? null : 'confirm',
          message: () => {
            const dirForPrompt =
              projectDir === '.'
                ? 'Current directory'
                : `Target directory "${projectDir}"`

            return `${dirForPrompt} is not empty. Remove existing files and continue?`
          },
        },
        {
          name: 'type',
          type: () => (argv.app || argv.lib ? null : 'select'),
          message: 'Select project type:',
          choices: [
            {
              title: 'Library',
              description:
                'Choose this if you want to build a library that can be published to npmjs.com',
              value: 'lib',
            },
            {
              title: 'Application',
              description:
                'Choose this if you want to build an executable application',
              value: 'app',
            },
          ],
          initial: 0,
        },
      ],
      {
        onCancel: () => {
          throw new Error(`${red('✖')} Operation cancelled`)
        },
      },
    )
  } catch (cancelled: any) {
    console.log(cancelled.message)
    process.exit(1)
  }

  const {
    projectName,
    packageName = projectName ?? defaultProjectName,
    force = argv.force,
    projectType = (argv.app && 'app') || (argv.lib && 'lib'),
  } = result
  const fullProjectDir = join(cwd, projectDir)

  if (existsSync(fullProjectDir) && force) {
    console.log(
      `\n${yellow('Crane')} is deleting the content of ${fullProjectDir}`,
    )
    emptyDir(fullProjectDir)
    console.log(`\n${yellow('Crane')} content deleted.`)
  } else if (!existsSync(fullProjectDir)) {
    mkdirSync(fullProjectDir)
    console.log(`\nProject folder ${fullProjectDir} created.`)
  }

  console.log(
    `\n${yellow('Crane')} is scaffolding the project in ${fullProjectDir}...`,
  )

  const pkg = { name: packageName, version: '0.0.0' }

  writeFileSync(
    resolve(fullProjectDir, 'package.json'),
    JSON.stringify(pkg, null, 2),
  )

  const templateRoot = resolve(__dirname, 'template')

  function render(templateName: string) {
    const templateDir = resolve(templateRoot, templateName)
    renderTemplate(templateDir, fullProjectDir)
  }
  render('base')
  // Instructions:
  // Supported package managers: pnpm > yarn > npm
  const userAgent = process.env.npm_config_user_agent ?? ''
  const packageManager = /pnpm/.test(userAgent)
    ? 'pnpm'
    : /yarn/.test(userAgent)
    ? 'yarn'
    : 'npm'

  // README generation
  writeFileSync(
    resolve(fullProjectDir, 'README.md'),
    generateReadme({
      projectName:
        result.projectName ?? result.packageName ?? defaultProjectName,
      packageManager,
      projectType,
    }),
  )

  console.log(`\n${yellow('Crane')} scaffolding complete. Now run:\n`)
  if (fullProjectDir !== cwd) {
    console.log(`  ${bold(green(`cd ${relative(cwd, fullProjectDir)}`))}`)
  }
  console.log(`  ${bold(green(getCommand(packageManager, 'install')))}`)
  console.log(`  ${bold(green(getCommand(packageManager, 'lint')))}`)
  console.log(`  ${bold(green(getCommand(packageManager, 'dev')))}`)
  console.log()
}

cli().catch((e) => {
  console.error(e)
})
// common deps: typescript, vitest, @vitest/coverage-istanbul, rome, coveralls, lint-staged, husky
// libs dev deps: common deps
// apps dev deps: common deps, tsx
// monorepo dev deps: turbo, @changesets/cli, @changesets/changelog-github
