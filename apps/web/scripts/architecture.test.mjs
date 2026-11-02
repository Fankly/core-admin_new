import assert from 'node:assert/strict'
import { test } from 'node:test'
import { architectureViolation } from './architecture-rules.mjs'
import { collectImports } from './source-imports.mjs'

test('extracts static, dynamic, type imports and re-exports in Vue scripts', () => {
  const { imports, errors } = collectImports(
    `<script setup lang="ts">
    import type { User } from '@/types/domain'
    export { value } from './value'
    const load = () => import('@/views/home.vue')
    type Response = import('@/api/system').SystemInfo
  </script><template><div /></template>`,
    'fixture.vue'
  )
  assert.deepEqual(errors, [])
  assert.deepEqual(
    imports.map(({ specifier, typeOnly }) => [specifier, typeOnly]),
    [
      ['@/types/domain', true],
      ['./value', false],
      ['@/views/home.vue', false],
      ['@/api/system', true]
    ]
  )
})

test('rejects reverse dependencies through both aliases and relative paths', () => {
  for (const specifier of ['@/views/home.vue', '../../views/home.vue', '@/store', 'element-plus']) {
    assert.ok(architectureViolation('api/system/user.ts', { specifier, typeOnly: true }))
  }
  assert.ok(architectureViolation('router/guards/index.ts', { specifier: '../../app/plugins' }))
  assert.equal(architectureViolation('app/bootstrap.ts', { specifier: '@/router' }), undefined)
  assert.equal(architectureViolation('api/system/user.ts', { specifier: '@/service/baseService' }), undefined)
})

test('permits Axios types but prevents business modules bypassing the request client', () => {
  const { imports } = collectImports("import { type Method } from 'axios'\nconst load = () => import('axios')", 'api/base.ts')
  assert.equal(architectureViolation('api/base.ts', imports[0]), undefined)
  assert.ok(architectureViolation('api/base.ts', imports[1]))
  assert.equal(architectureViolation('service/http/transport.ts', imports[1]), undefined)
})
