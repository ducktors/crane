#!/usr/bin/env node
import { intro, outro, spinner } from '@clack/prompts'
import { red, bold, bgYellow, black, yellow, green, bgRed } from 'picocolors'
import minimist from 'minimist'
import { join, relative, resolve } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { emptyDir } from './lib/empty-dir'
import { renderApp } from './lib/renderers/app'
import { renderLib } from './lib/renderers/lib'
import { renderMonorepo } from './lib/renderers/monorepo'
import { renderWithChangesets } from './lib/renderers/wtih-changesets'
import { renderWithHusky } from './lib/renderers/wtih-husky'
import { renderWithGH } from './lib/renderers/wtih-gh'
import { gitInitRepo } from './lib/git-init-repo'
import { renderReadme } from './lib/renderers/readme'
import { getCommand } from './lib/get-command'
import { askInstallDeps, runPrompt } from './lib/run-prompt'
import { installDeps } from './lib/inistall-deps'
import { ensurePnpm } from './lib/ensure-pnpm'
import { renderWithCommitlint } from './lib/renderers/with-commitlint'

const { version } = require('./package.json')

// possible options:
// --lib
// --app
// --help
// --monorepo
// --force (for force overwriting)
// --inject (for injecting into existing project)
// --git (for git init)
// --actions (for github actions)
// --changesets (for changesets)
// --commitlint (for commitlint)
const {
  _,
  lib,
  app,
  monorepo,
  force,
  inject,
  git,
  actions,
  changesets,
  commitlint,
} = minimist(process.argv.slice(2), {
  string: ['_'],
  boolean: true,
})

const cwd = process.cwd()
const projectDir = _[0]
const defaultProjectDir = projectDir

if ([app, lib, monorepo].filter(Boolean).length > 1) {
  console.log(
    red('✖'),
    bold('Choose only one between --app, --lib and --monorepo'),
  )
  process.exit(1)
}

async function main() {
  await ensurePnpm()

  console.log()
  intro(bgYellow(black(` Crane CLI v${version} `)))

  const {
    projectDir,
    existingProject,
    packageName,
    projectType,
    initChangesets,
    initGit,
    initCommitLint,
    initActions,
  } = await runPrompt({
    projectDir: defaultProjectDir,
    app,
    lib,
    monorepo,
    force,
    inject,
    changesets,
    git,
    commitlint,
    actions,
  })

  const fullProjectDir = join(cwd, projectDir)
  const projectAlreadyExists = existsSync(fullProjectDir)

  if (projectAlreadyExists) {
    if (existingProject === 'force') {
      executeForce(fullProjectDir)
    }
  } else {
    createFolder(fullProjectDir)
  }

  await scaffold({
    fullProjectDir,
    existingProject,
    packageName,
    projectType,
    initChangesets,
    initGit,
    initCommitLint,
    initActions,
  })

  const shouldInstallDeps = await askInstallDeps({ projectType })
  if (shouldInstallDeps) {
    await executeInstallDeps({
      fullProjectDir,
    })
  }

  outro(bgYellow(black("You're all set!")))

  printGuideText({
    fullProjectDir,
    changesets,
    projectType,
    shouldInstallDeps,
    initGit,
  })
}

main().catch(console.error)

function executeForce(fullProjectDir: string) {
  const s = spinner()
  s.start(` Deleting the content of ${fullProjectDir}...`)
  try {
    emptyDir(fullProjectDir)
  } catch (e) {
    console.log(red('✖'), bgRed(' Failed to delete project folder'))
    console.log()
    console.log(e)
    process.exit(1)
  }
  s.stop(`${fullProjectDir} content deleted`)
}

function createFolder(fullProjectDir: string) {
  const s = spinner()
  s.start(`Creating project folder: ${fullProjectDir}`)
  try {
    mkdirSync(fullProjectDir, { recursive: true })
  } catch (e) {
    console.log(red('✖'), bgRed(' Failed to create project folder'))
    console.log()
    console.log(e)
    process.exit(1)
  }
  s.stop(`Project folder ${fullProjectDir} created`)
}

async function executeInstallDeps({
  fullProjectDir,
}: {
  fullProjectDir: string
}) {
  const s = spinner()
  s.start(`Installing dependencies using in ${fullProjectDir} with pnpm...`)
  try {
    await installDeps({ destFolder: fullProjectDir })
  } catch (e) {
    console.log(red('✖'), bgRed(' Failed to install dependencies'))
    console.log()
    console.log(e)
    process.exit(1)
  }
  s.stop('Dependencies installed')
}

async function scaffold({
  fullProjectDir,
  existingProject,
  projectType,
  packageName,
  initChangesets,
  initGit,
  initCommitLint,
  initActions,
}: {
  fullProjectDir: string
  existingProject: 'force' | 'inject' | 'skip'
  projectType: 'app' | 'lib' | 'monorepo' | 'monorepo-app' | 'monorepo-lib'
  packageName: string | undefined
  initChangesets: boolean
  initGit: boolean
  initCommitLint: boolean
  initActions: boolean
}) {
  try {
    const s = spinner()
    const actionMessage =
      existingProject === 'inject' ? 'Injecting' : 'Scaffolding'
    s.start(`${actionMessage} ${packageName} in ${fullProjectDir}...`)
    const templateRoot = resolve(__dirname, 'template')

    if (projectType === 'app' || projectType === 'monorepo-app') {
      await renderApp(
        templateRoot,
        packageName,
        fullProjectDir,
        existingProject,
      )
    } else if (projectType === 'lib' || projectType === 'monorepo-lib') {
      await renderLib(
        templateRoot,
        packageName,
        fullProjectDir,
        existingProject,
      )
    } else if (projectType === 'monorepo') {
      await renderMonorepo(templateRoot, fullProjectDir, existingProject)
    }
    s.stop('Base scaffolding complete')

    if (initChangesets) {
      const spinnerChangesets = spinner()
      spinnerChangesets.start('Adding changesets...')
      renderWithChangesets(templateRoot, fullProjectDir)
      spinnerChangesets.stop('changesets added')
    }

    // render husky only at top root level project dir
    if (initGit) {
      const spinnerHusky = spinner()
      spinnerHusky.start('Adding husky...')
      renderWithHusky(templateRoot, fullProjectDir)
      spinnerHusky.stop('husky added')

      if (initCommitLint) {
        const spinnerCommitLint = spinner()
        spinnerCommitLint.start('Adding commitlint...')
        renderWithCommitlint(templateRoot, fullProjectDir)
        spinnerCommitLint.stop('commitlint added')
      }

      if (initActions) {
        const spinnerActions = spinner()
        spinnerActions.start('Adding GitHub actions...')
        renderWithGH(templateRoot, fullProjectDir, 'standalone')
        if (projectType === 'monorepo') {
          renderWithGH(templateRoot, fullProjectDir, 'monorepo')
        }
        spinnerActions.stop('GitHub actions added')
      }

      const spinnerGit = spinner()
      spinnerGit.start('Initializing git...')
      await gitInitRepo(fullProjectDir)
      spinnerGit.stop('git initialized')
    }

    const spinnerReadme = spinner()
    spinnerReadme.start('Rendering README...')
    renderReadme(
      packageName ?? defaultProjectDir,
      projectType,
      fullProjectDir,
      existingProject,
    )
    spinnerReadme.stop('README rendered')
  } catch (e) {
    const actionMessage = existingProject === 'inject' ? 'inject' : 'scaffold'
    console.log(red('✖'), bgRed(` Failed to ${actionMessage} the project`))
    console.log()
    console.log(e)
    process.exit(1)
  }
}

function printGuideText({
  fullProjectDir,
  changesets,
  projectType,
  shouldInstallDeps,
  initGit,
}: {
  fullProjectDir: string
  changesets: boolean
  projectType: string
  shouldInstallDeps: boolean
  initGit: boolean
}) {
  if (projectType !== 'monorepo-app' && projectType !== 'monorepo-lib') {
    console.log(bold('Now run:\n'))
    if (fullProjectDir !== cwd) {
      console.log(`  ${bold(green(`cd ${relative(cwd, fullProjectDir)}`))}`)
    }
    if (!shouldInstallDeps) {
      console.log(`  ${bold(green(getCommand('pnpm', 'install')))}`)
    }

    if (initGit) {
      console.log()
      console.log(
        `${bold(
          yellow(
            'Check the .husky folder and make sure the hooks are executable. If not, run: chmod ug+x .husky/*',
          ),
        )}`,
      )
    }

    console.log()
    console.log(bold('Available commands:\n'))
    console.log()

    console.log(`  ${bold(green(getCommand('pnpm', 'dev')))}`)
    console.log(`  ${bold(green(getCommand('pnpm', 'build')))}`)
    console.log(`  ${bold(green(getCommand('pnpm', 'test')))}`)
    console.log(`  ${bold(green(getCommand('pnpm', 'test:ci')))}`)
    console.log(`  ${bold(green(getCommand('pnpm', 'lint')))}`)
    console.log(`  ${bold(green(getCommand('pnpm', 'format')))}`)

    if (changesets) {
      console.log(`  ${bold(green(getCommand('pnpm', 'changeset')))}`)
      console.log(`  ${bold(green(getCommand('pnpm', 'changeset version')))}`)
      console.log(`  ${bold(green(getCommand('pnpm', 'release')))}`)
    }
    console.log()

    if (projectType === 'monorepo') {
      console.log(
        `${bold(
          yellow(
            `To enable Turborepo Remote Cache, don't forget to put your settings inside ${fullProjectDir}/.turbo/config.json file.`,
          ),
        )}`,
      )
    }
  }
}
