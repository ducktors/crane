export function getUserAgent(isMonorepo: boolean) {
  if (isMonorepo) {
    return 'pnpm'
  }
  const userAgent = process.env.npm_config_user_agent ?? ''
  const packageManager = /pnpm/.test(userAgent)
    ? 'pnpm'
    : /yarn/.test(userAgent)
    ? 'yarn'
    : 'npm'
  return packageManager
}
