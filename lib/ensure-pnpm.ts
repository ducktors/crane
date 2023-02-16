import { intro, outro, spinner } from '@clack/prompts'
import { bgRed, black, red, underline, bgGreen, bgWhite } from 'picocolors'
import { getUserAgent } from './get-user-agent'
import { askInstallPnpm } from './run-prompt'

async function checkPnpm() {
  const binary = 'pnpm'
  try {
    const { execa } = await import('execa')
    await execa(binary, ['--version'])
    return true
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false
    } else if (error.code === 'EACCES') {
      console.log(error)
    }
    process.exit(1)
  }
}

export async function ensurePnpm() {
  const isPnpmAvailable = await checkPnpm()
  if (!isPnpmAvailable) {
    console.log()
    intro(bgRed(black(underline(' Crane CLI is missing some pre-requisites'))))
    const shouldInstallPnpm = await askInstallPnpm()
    if (shouldInstallPnpm) {
      const s = spinner()
      s.start('Installing pnpm...')
      try {
        const packageManager = getUserAgent()

        const { execa } = await import('execa')
        await execa(packageManager, ['i', '-g', 'pnpm'])
      } catch (e) {
        console.log(red('✖'), bgRed(' Failed to install pnpm'))
        console.log()
        console.log(e)
        process.exit(1)
      }
      s.stop('pnpm installed')
    }
    const outroMessage = `${bgGreen(
      black('Pre-requisites installed.'),
    )} Run the Crane CLI again with ${bgWhite(
      black(' pnpm create crane@latest '),
    )}`
    outro(outroMessage)
    process.exit(0)
  }
}
