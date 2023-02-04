// taken from https://github.com/vuejs/create-vue/blob/main/utils/sortDependencies.ts

export function sortProperties(packageJson: any) {
  const sorted: any = {}

  const propertiesTypes = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
    'scripts',
  ]

  for (const prop of propertiesTypes) {
    if (packageJson[prop]) {
      sorted[prop] = {}

      Object.keys(packageJson[prop])
        .sort()
        .forEach((name) => {
          sorted[prop][name] = packageJson[prop][name]
        })
    }
  }

  return {
    ...packageJson,
    ...sorted,
  }
}
