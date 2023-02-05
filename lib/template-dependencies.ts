const BASE_DEV_DEPENDENCIES = [
  '@types/node',
  '@vitest/coverage-istanbul',
  'husky',
  'lint-staged',
  'rome',
  'typescript',
  'vitest',
]

export const BASE_DEPENDENCIES = [
  'tslib',
]

const APP_DEV_DEPENDENCIES = new Set<string>(
  BASE_DEV_DEPENDENCIES.concat(
    [
      'rimraf',
      'tsx',
    ]
  )
)

const APP_DEPENDENCIES = new Set<string>(BASE_DEPENDENCIES)

const LIB_DEV_DEPENDENCIES = new Set<string>(
  BASE_DEV_DEPENDENCIES.concat(
    ['tsup']
  ),
)

const LIB_DEPENDENCIES = new Set<string>(BASE_DEPENDENCIES)

export const dependenciesByTemplate = new Map([
  [
    'lib', {
      dependencies: APP_DEPENDENCIES,
      devDependencies: APP_DEV_DEPENDENCIES,
    }
  ],
  [
    'app', {
      dependencies: LIB_DEPENDENCIES,
      devDependencies: LIB_DEV_DEPENDENCIES,
    }
  ]
])
