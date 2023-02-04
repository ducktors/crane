// taken from https://github.com/vuejs/create-vue/blob/main/utils/sortDependencies.ts

export function sortDependencies(packageJson: any) {
  const sorted: any = {}

  const depTypes = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]

  for (const depType of depTypes) {
    if (packageJson[depType]) {
      sorted[depType] = {}

      Object.keys(packageJson[depType])
        .sort()
        .forEach((name) => {
          sorted[depType][name] = packageJson[depType][name]
        })
    }
  }

  return {
    ...packageJson,
    ...sorted,
  }
}
