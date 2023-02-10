interface PackageJson {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

export function generateDependencies(cliPackage: PackageJson, templateDependencies?: Set<string>) {
  const dependencies: PackageJson['dependencies'] | PackageJson['devDependencies'] = {}
  for (const dep of Array.from(templateDependencies ?? [])) {
    dependencies[dep] = cliPackage.devDependencies[dep] || cliPackage.dependencies[dep]
  }
  return dependencies
}
