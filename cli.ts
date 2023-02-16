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
import { renderWithActions } from './lib/renderers/wtih-actions'
import { gitInitRepo } from './lib/git-init-repo'
import { renderReadme } from './lib/renderers/readme'
import { getCommand } from './lib/get-command'
import { askInstallDeps, runPrompt } from './lib/run-prompt'
import { installDeps } from './lib/inistall-deps'
import { ensurePnpm } from './lib/ensure-pnpm'

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
const { _, lib, app, monorepo, force, inject, git, actions, changesets } =
  minimist(process.argv.slice(2), {
    string: ['_'],
    boolean: true,
  })

const cwd = process.cwd()
const projectDir = _[0]
const defaultProjectName = projectDir

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
  intro(bgYellow(black(' Crane CLI ')))

  const {
    projectName,
    existingProject,
    packageName,
    projectType,
    initChangesets,
    initGit,
    initActions,
  } = await runPrompt({
    projectDir: defaultProjectName,
    app,
    lib,
    monorepo,
    force,
    inject,
    changesets,
    git,
    actions,
  })

  const fullProjectDir = join(cwd, projectName)

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
    projectName,
    packageName,
    projectType,
    initChangesets,
    initGit,
    initActions,
  })

  const shouldInstallDeps = await askInstallDeps()
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
    mkdirSync(fullProjectDir)
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
  projectType,
  packageName,
  projectName,
  initChangesets,
  initGit,
  initActions,
}: {
  fullProjectDir: string
  projectType: string
  packageName: string
  projectName: string
  initChangesets: boolean
  initGit: boolean
  initActions: boolean
}) {
  try {
    const s = spinner()
    s.start(`Scaffolding ${projectName} in ${fullProjectDir}...`)
    const templateRoot = resolve(__dirname, 'template')

    if (projectType === 'app') {
      renderApp(templateRoot, packageName, fullProjectDir)
    } else if (projectType === 'lib') {
      renderLib(templateRoot, packageName, fullProjectDir)
    } else if (projectType === 'monorepo') {
      renderMonorepo(templateRoot, packageName, fullProjectDir)
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
      if (initActions) {
        const spinnerActions = spinner()
        spinnerActions.start('Adding GitHub actions...')
        renderWithActions(templateRoot, fullProjectDir, 'standalone')
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
      projectName ?? packageName ?? defaultProjectName,
      projectType,
      fullProjectDir,
    )
    spinnerReadme.stop('README rendered')
  } catch (e) {
    console.log(red('✖'), bgRed(' Failed to scaffold the project'))
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
}: {
  fullProjectDir: string
  changesets: boolean
  projectType: string
  shouldInstallDeps: boolean
}) {
  console.log(bold('Now run:\n'))
  if (fullProjectDir !== cwd) {
    console.log(`  ${bold(green(`cd ${relative(cwd, fullProjectDir)}`))}`)
  }
  if (!shouldInstallDeps) {
    console.log(`  ${bold(green(getCommand('pnpm', 'install')))}`)
  }

  console.log()
  console.log(bold('Other available commands:\n'))
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
