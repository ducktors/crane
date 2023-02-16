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
  const projectName = await askProjectName({ projectDir })
  const existingProject = await askExistingProject({
    projectName,
    force,
    inject,
  })
  const packageName = await askPackageName({ projectName })
  const projectType = await askProjectType({
    app,
    lib,
    monorepo,
  })
  const initChangesets = await askChangesets({
    projectType,
    changesets,
  })
  const initGit = await askInitGit({ git })
  const initActions = await askActions({ actions })

  return {
    projectName,
    existingProject,
    packageName,
    projectType,
    initChangesets,
    initGit,
    initActions,
  }
}

async function askProjectName({ projectDir }: { projectDir?: string } = {}) {
  const projectName = projectDir?.trim()

  if (projectName) {
    return projectName
  }

  const answer = await text({
    message: 'Project name:',
    placeholder: projectDir,
    initialValue: projectDir,
    validate(value) {
      if (!value) {
        return 'Project name is required'
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

async function askPackageName({ projectName }: { projectName?: string }) {
  const initialValue = projectName ? toValidPackageName(projectName) : undefined
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

  const shouldContinue = await confirm({
    message: 'Do you want to add Changesets?',
  })

  if (isCancel(shouldContinue)) {
    cancel('Operation cancelled')
    return process.exit(0)
  }

  return shouldContinue
}

async function askInitGit({ git }: { git?: boolean } = {}) {
  if (git) {
    return true
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

async function askActions({ actions }: { actions?: boolean } = {}) {
  if (actions) {
    return true
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

export async function askInstallDeps() {
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
