export async function installDeps({ destFolder }: { destFolder: string }) {
  const { execa } = await import('execa')
  await execa('pnpm', ['i'], { cwd: destFolder })
  await execa('pnpm', ['update'], { cwd: destFolder })
}
