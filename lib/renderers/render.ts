import { resolve } from 'node:path'
import renderTemplate from './template'

export function render(
  templateRoot: string,
  templateName: string,
  destFolder: string,
) {
  const templateDir = resolve(templateRoot, templateName)
  renderTemplate(templateDir, destFolder)
}
