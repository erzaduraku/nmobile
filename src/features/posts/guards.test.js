import test from 'node:test'
import assert from 'node:assert/strict'
import { ownsStoragePath } from './storagePath.js'
import { oauthStateOk } from '../instagram/oauthState.js'
import { needsInstagramPublish } from '../instagram/publishGuard.js'

const uid = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'

test('oauth state is accepted only when it matches the saved value', () => {
  assert.equal(oauthStateOk('abc', 'abc'), true)
  assert.equal(oauthStateOk('abc', 'abc#_'), true)
  assert.equal(oauthStateOk(null, 'abc'), false)
  assert.equal(oauthStateOk('', 'abc'), false)
  assert.equal(oauthStateOk('abc', 'other'), false)
  assert.equal(oauthStateOk('abc', ''), false)
})

test('a storage path is owned only when it starts with that user id', () => {
  assert.equal(ownsStoragePath(uid, `${uid}/post.jpg`), true)
  assert.equal(ownsStoragePath(uid, `${other}/post.jpg`), false)
  assert.equal(ownsStoragePath(uid, uid), false)
  assert.equal(ownsStoragePath(uid, `${uid}/../${other}/post.jpg`), false)
  assert.equal(ownsStoragePath(uid, ''), false)
  assert.equal(ownsStoragePath('', `${uid}/post.jpg`), false)
})

test('publish is skipped when ig_media_id is already present', () => {
  assert.equal(needsInstagramPublish({ ig_media_id: '17890000000000000' }), false)
  assert.equal(needsInstagramPublish({}), true)
  assert.equal(needsInstagramPublish(null), true)
})
