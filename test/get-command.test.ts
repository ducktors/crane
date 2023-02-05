import { test, expect } from 'vitest'

import { getCommand } from '../lib/get-command'

test('should return correct install command for yarn', () => {
  expect(getCommand('yarn', 'install')).toBe('yarn')
})
test('should return correct command without args for yarn', () => {
  expect(getCommand('yarn', 'test')).toBe('yarn test')
})
test('should return correct command with args for yarn', () => {
  expect(getCommand('yarn', 'test', 'my args')).toBe('yarn test my args')
})

test('should return correct install command for npm', () => {
  expect(getCommand('npm', 'install')).toBe('npm install')
})
test('should return correct command without args for npm', () => {
  expect(getCommand('npm', 'test')).toBe('npm run test')
})
test('should return correct command with args for npm', () => {
  expect(getCommand('npm', 'test', 'my args')).toBe('npm run test -- my args')
})

test('should return correct install command for pnpm', () => {
  expect(getCommand('pnpm', 'install')).toBe('pnpm install')
})
test('should return correct command without args for pnpm', () => {
  expect(getCommand('pnpm', 'test')).toBe('pnpm test')
})
test('should return correct command with args for pnpm', () => {
  expect(getCommand('pnpm', 'test', 'my args')).toBe('pnpm test my args')
})
