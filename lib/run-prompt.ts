import { confirm, select, isCancel, cancel, text } from '@clack/prompts'

import { canSkipEmptying } from './can-skip-emptying'
import { isValidPackageName, toValidPackageName } from './package-name-utils'

export async function runPrompt({
  projectDir,
  app,
  lib,
  monorepo,
  force,
  inject,
  changesets,
  git,
  actions,
}: {
  projectDir: string
  app?: boolean
  lib?: boolean
  monorepo?: boolean
  force?: boolean
  inject?: boolean
  changesets?: boolean
  git?: boolean
  actions?: boolean
}) {
  const chosenProjectDir = await askProjectDir({ projectDir })
  const existingProject = await askExistingProject({
    projectName: chosenProjectDir,
    force,
    inject,
  })
  const packageName = await askPackageName({ projectDir: chosenProjectDir })
  const projectType = await askProjectType({
    app,
    lib,
    monorepo,
  })
  const initChangesets = await askChangesets({
    projectType,
    changesets,
  })
  const initGit = await askInitGit({ git, projectType })
  const initActions = await askActions({ actions, projectType })

  return {
    projectDir: chosenProjectDir,
    existingProject: existingProject as 'force' | 'inject' | 'skip',
    packageName,
    projectType,
    initChangesets,
    initGit,
    initActions,
  }
}

async function askProjectDir({ projectDir }: { projectDir?: string } = {}) {
  const trimmedProjectDir = projectDir?.trim()

  if (trimmedProjectDir) {
    return trimmedProjectDir
  }

  const answer = await text({
    message: 'Project Directory:',
    placeholder: projectDir,
    initialValue: projectDir,
    validate(value) {
      if (!value) {
        return 'Project Directory is required'
      }
    },
  })

  if (isCancel(answer)) {
    cancel('Operation cancelled')
    return process.exit(0)
  }

  return answer
}

async function askExistingProject({
  force,
  inject,
  projectName,
}: { force?: boolean; inject?: boolean; projectName: string }) {
  if (canSkipEmptying(projectName)) {
    return 'skip'
  } else if (force) {
    return 'force'
  } else if (inject) {
    return 'inject'
  }

  const dirForPrompt =
    projectName === '.'
      ? 'Current directory'
      : `Target directory "${projectName}"`

  const existingProject = await select({
    message: `${dirForPrompt} is not empty. What do you want to do with the existing project?`,
    options: [
      {
        value: 'cancel',
        label: 'Cancel',
        hint: 'Do nothing and quit.',
      },
      {
        value: 'inject',
        label: 'Inject',
        hint: 'Inject toolchain into existing project (this will overwrite some files partially/entirely).',
      },
      {
        value: 'force',
        label: 'Overwrite',
        hint: 'Delete existing files and create a new project.',
      },
    ],
    initialValue: 'cancel',
  })

  if (isCancel(existingProject) || existingProject === 'cancel') {
    cancel('Operation cancelled')
    return process.exit(0)
  }
  return existingProject
}

async function askPackageName({ projectDir }: { projectDir?: string }) {
  const initialValue = projectDir ? toValidPackageName(projectDir) : undefined
  const packageName = await text({
    message: 'Package name:',
    initialValue,
    validate(value) {
      if (!isValidPackageName(value)) {
        return 'Invalid package.json name'
      }
    },
  })
  if (isCancel(packageName)) {
    cancel('Operation cancelled')
    return process.exit(0)
  }

  return packageName
}

async function askProjectType({
  lib,
  app,
  monorepo,
}: { lib?: boolean; app?: boolean; monorepo?: boolean } = {}) {
  if (lib) {
    return 'lib'
  } else if (app) {
    return 'app'
  } else if (monorepo) {
    return 'monorepo'
  }

  const projectType = await select({
    message: 'Select project type:',
    options: [
      {
        value: 'lib',
        label: 'Library',
        hint: 'Choose this if you want to create a library that can be published to npmjs.com',
      },
      {
        value: 'app',
        label: 'Application',
        hint: 'Choose this if you want to create an executable application',
      },
      {
        value: 'monorepo',
        label: 'Monorepo',
        hint: 'Choose this if you want to create a pnpm and Turborepo monorepo.',
      },
      {
        value: 'monorepo-app',
        label: 'Monorepo Application',
        hint: 'Choose this if you want to add a new application to a monorepo.',
      },
      {
        value: 'monorepo-lib',
        label: 'Monorepo Library',
        hint: 'Choose this if you want to add a new library to a monorepo.',
      },
    ],
    initialValue: 'lib',
  })

  if (isCancel(projectType)) {
    cancel('Operation cancelled')
    return process.exit(0)
  }

  return projectType
}

async function askChangesets({
  changesets,
  projectType,
}: { changesets?: boolean; projectType: string }) {
  if (changesets || projectType === 'monorepo') {
    return true
  }

  if (projectType === 'monorepo-app' || projectType === 'monorepo-lib') {
    return false
  }

  const shouldContinue = await confirm({
    message: 'Do you want to add Changesets?',
  })

  if (isCancel(shouldContinue)) {
    cancel('Operation cancelled')
    return process.exit(0)
  }

  return shouldContinue
}

async function askInitGit({
  git,
  projectType,
}: { git?: boolean; projectType?: string } = {}) {
  if (git) {
    return true
  }

  if (projectType === 'monorepo-app' || projectType === 'monorepo-lib') {
    return false
  }

  const shouldContinue = await confirm({
    message: 'Do you want to initialize git?',
  })

  if (isCancel(shouldContinue)) {
    cancel('Operation cancelled')
    return process.exit(0)
  }

  return shouldContinue
}

async function askActions({
  actions,
  projectType,
}: { actions?: boolean; projectType?: string } = {}) {
  if (actions) {
    return true
  }

  if (projectType === 'monorepo-app' || projectType === 'monorepo-lib') {
    return false
  }

  const shouldContinue = await confirm({
    message: 'Do you want to add GH actions?',
  })

  if (isCancel(shouldContinue)) {
    cancel('Operation cancelled')
    return process.exit(0)
  }

  return shouldContinue
}

export async function askInstallDeps({
  projectType,
}: {
  projectType: 'app' | 'lib' | 'monorepo' | 'monorepo-app' | 'monorepo-lib'
}) {
  // we don't need to run install deps for projects added to a monorepo
  if (projectType === 'monorepo-app' || projectType === 'monorepo-lib') {
    return false
  }
  const shouldContinue = await confirm({
    message: 'Do you want to install dependencies now?',
  })

  if (isCancel(shouldContinue)) {
    cancel('Operation cancelled')
    return process.exit(0)
  }

  return shouldContinue
}

export async function askInstallPnpm() {
  const shouldContinue = await confirm({
    message: 'Unable to locate pnpm. Do you want to install it now?',
  })

  if (isCancel(shouldContinue) || !shouldContinue) {
    cancel('Crane requires pnpm')
    return process.exit(0)
  }

  return shouldContinue
}
