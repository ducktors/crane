#!/bin/env node
import { existsSync, mkdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import prompts from 'prompts'
import minimist from 'minimist'
import { red, yellow, bold, green, cyan } from 'kolorist'

import { getCommand } from './lib/get-command'
import { renderApp } from './lib/render-app'
import { renderLib } from './lib/render-lib'
import { renderMonorepo } from './lib/render-monorepo'
import { renderReadme } from './lib/render-readme'
import { gitInitRepo } from './lib/git-init-repo'
import { getUserAgent } from './lib/get-user-agent'
import { renderWithHusky } from './lib/render-wtih-husky'
import { canSkipEmptying } from './lib/can-skip-emptying'
import { emptyDir } from './lib/empty-dir'

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

if ([argv.app, argv.lib, argv.monorepo].filter(Boolean).length > 1) {
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
    console.log(bold(yellow('Crane CLI')))
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
            {
              title: 'Monorepo',
              description:
                'Choose this if you want to build a pnpm and Turborepo monorepo.',
              value: 'monorepo',
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
    projectType = (argv.app && 'app') ||
      (argv.lib && 'lib') ||
      (argv.monorepo && 'monorepo'),
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

  const templateRoot = resolve(__dirname, 'template')

  if (projectType === 'app') {
    renderApp(templateRoot, packageName, fullProjectDir)
  } else if (projectType === 'lib') {
    renderLib(templateRoot, packageName, fullProjectDir)
  } else if (projectType === 'monorepo') {
    renderMonorepo(templateRoot, packageName, fullProjectDir)
  }

  // render husky only at top root level project dir
  renderWithHusky(templateRoot, fullProjectDir)

  const packageManager = getUserAgent(projectType === 'monorepo')
  renderReadme(
    packageManager,
    result.projectName ?? result.packageName ?? defaultProjectName,
    projectType,
    fullProjectDir,
  )

  await gitInitRepo(fullProjectDir)

  console.log(
    `\n${green('✔')} ${yellow('Crane')} Scaffolding complete. Now run:\n`,
  )
  if (fullProjectDir !== cwd) {
    console.log(`  ${bold(green(`cd ${relative(cwd, fullProjectDir)}`))}`)
  }
  console.log(`  ${bold(green(getCommand(packageManager, 'install')))}`)

  console.log()
  console.log(`\n${yellow('Crane')} Other available commands:\n`)
  console.log()

  console.log(`  ${bold(green(getCommand(packageManager, 'dev')))}`)
  console.log(`  ${bold(green(getCommand(packageManager, 'build')))}`)
  console.log(`  ${bold(green(getCommand(packageManager, 'test')))}`)
  console.log(`  ${bold(green(getCommand(packageManager, 'lint')))}`)
  console.log(`  ${bold(green(getCommand(packageManager, 'format')))}`)
  console.log()

  if (projectType === 'monorepo') {
    // console.log(`  ${bold(green(getCommand(packageManager, 'changeset')))}`)
    // console.log(`  ${bold(green(getCommand(packageManager, 'release')))}`)
    console.log(
      `${bold(
        yellow(
          `To enable Turborepo Remote Cache, don't forget to put your settings inside ${fullProjectDir}/.turbo/config.json file.`,
        ),
      )}`,
    )
  }
}
// common deps: @types/node, typescript, vitest, @vitest/coverage-istanbul, rome, coveralls, lint-staged, husky
// libs dev deps: common deps, tsup
// apps dev deps: common deps, tsx
// monorepo dev deps: turbo, @changesets/cli, @changesets/changelog-github

cli().catch((e) => {
  console.error(e)
})
