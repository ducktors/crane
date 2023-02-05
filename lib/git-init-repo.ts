import { bold, green, red, yellow } from 'kolorist'
import { rmdirSync } from 'node:fs'

export async function gitInitRepo(destFolder: string) {
  try {
    const { execa } = await import('execa')
    await execa('git', ['init'], { cwd: destFolder })
    console.log(`\n${green('✔')} ${yellow('Crane')} Git repo initialized.`)
  } catch (err: any) {
    console.error(err)
    console.log(
      `\n${red('✖')} ${yellow('Crane')} ${`${bold('git init failed')} with "${
        err.message.split('\n')[0]
      }"`}`,
    )
    rmdirSync(destFolder, { recursive: true })
    console.log(
      `\n${green('✔')} ${yellow('Crane')} Project directory rolled back.`,
    )
    process.exit(1)
  }
}
