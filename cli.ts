#!/bin/env node
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
import { red, yellow, bold, green, cyan } from 'kolorist'

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

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName,
  )
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
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
    console.log()
    console.log('🏗️')
    console.log()

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
          name: 'packageName',
          type: () => (isValidPackageName(projectDir) ? null : 'text'),
          message: 'Package name:',
          initial: () => toValidPackageName(projectDir),
          validate: (dir) =>
            isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
          name: 'projectType',
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
      `\n${cyan('/')} ${yellow(
        'Crane',
      )} Deleting the content of ${fullProjectDir}`,
    )
    emptyDir(fullProjectDir)
    console.log(`\n${green('✔')} ${yellow('Crane')} Content deleted.`)
  } else if (!existsSync(fullProjectDir)) {
    mkdirSync(fullProjectDir)
    console.log(
      `\n${green('✔')} ${yellow(
        'Crane',
      )} Project folder ${fullProjectDir} created.`,
    )
  } else {
    console.log(
      `\n${yellow('⚠')} ${yellow(
        'Crane',
      )} Project folder ${fullProjectDir} already exists.`,
    )
    console.log(
      `\n${red('✖')} ${yellow(
        'Crane',
      )} If you want to overwrite the content of the folder, please run the command with the --force option.`,
    )
    process.exit(1)
  }

  console.log(
    `\n${cyan('/')} ${yellow(
      'Crane',
    )} Scaffolding the project in ${fullProjectDir}`,
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

  if (projectType === 'app') {
    render('app')
  } else if (projectType === 'lib') {
    render('lib')
  }

  const packageManager = 'pnpm'
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

  try {
    const { execa } = await import('execa')
    const out = await execa('git', ['init'], { cwd: fullProjectDir })
    console.log(`\n${green('✔')} ${yellow('Crane')} ${out.stdout}`)
  } catch (err: any) {
    console.log(
      `\n${red('✖')} ${yellow('Crane')} ${`${bold('git init failed')} with "${
        err.message.split('\n')[0]
      }"`}`,
    )
    rmdirSync(fullProjectDir, { recursive: true })
    console.log(
      `\n${green('✔')} ${yellow('Crane')} Project directory rolled back.`,
    )
    process.exit(1)
  }

  console.log(
    `\n${green('✔')} ${yellow('Crane')} Scaffolding complete. Now run:\n`,
  )
  if (fullProjectDir !== cwd) {
    console.log(`  ${bold(green(`cd ${relative(cwd, fullProjectDir)}`))}`)
  }
  console.log(`  ${bold(green(getCommand(packageManager, 'install')))}`)
  console.log(`  ${bold(green(getCommand(packageManager, 'lint')))}`)
  console.log(`  ${bold(green(getCommand(packageManager, 'dev')))}`)
  console.log()
}
// common deps: @types/node, typescript, vitest, @vitest/coverage-istanbul, rome, coveralls, lint-staged, husky
// libs dev deps: common deps, tsup
// apps dev deps: common deps, tsx
// monorepo dev deps: turbo, @changesets/cli, @changesets/changelog-github

cli().catch((e) => {
  console.error(e)
})
