import { defineConfig } from 'vite'
import { execFileSync } from 'node:child_process'

export default defineConfig({
  base: '/midcreek-cs-2/',
  define: {
    __BUILD_ID__: JSON.stringify(
      execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
        encoding: 'utf8',
      }).trim() +
        (execFileSync('git', ['status', '--porcelain'], {
          encoding: 'utf8',
        }).trim()
          ? '-dirty'
          : ''),
    ),
  },
  build: {
    sourcemap: true,
  },
})
