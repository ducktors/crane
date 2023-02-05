import { expect, test } from 'vitest'
import { generateDependencies } from '../lib/generate-dependencies'

const cliPackage = {
  dependencies: {
    d: '4'
  },
  devDependencies: {
    a: '1',
    b: '2',
    c: '3',
    '@test': '0',
  }
}

test('should return dependencies in template with values from cliPackage devDependencies', () => {
  expect(JSON.stringify(generateDependencies(cliPackage, new Set(['b', 'c'])))).toStrictEqual(JSON.stringify({
      b: '2',
      c: '3',
  }))
})

test('should return dependencies in template with values from cliPackage dependencies if missing devDependencies', () => {
  expect(JSON.stringify(generateDependencies(cliPackage, new Set(['b', 'c', 'd'])))).toStrictEqual(JSON.stringify({
      b: '2',
      c: '3',
      d: '4',
  }))
})

test('should return dependencies in template sorted alphabetically', () => {
  expect(JSON.stringify(generateDependencies(cliPackage, new Set(['d', 'c', '@test'])))).toStrictEqual(JSON.stringify({
      '@test': '0',
      c: '3',
      d: '4',
  }))
})
